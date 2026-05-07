import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import NavBar from '../components/NavBar';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import AiChat from '../components/AiChat';
import { apiFetch, API_BASE_URL } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import './Community.css';

const ROOMS = ['General', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const ROOM_INFO = {
  General: { title: 'General', subtitle: 'Open Discussion', desc: 'Chat with all LingoPeer learners.' },
  A1: { title: "A1 Beginner's Hub", subtitle: 'Beginner', desc: 'Start your English journey here.' },
  A2: { title: 'A2 Beginner Lounge', subtitle: 'Elementary', desc: 'Build your basic conversation skills.' },
  B1: { title: 'B1 Intermediate Lounge', subtitle: 'Intermediate', desc: 'Practice daily topics & improve fluency.' },
  B2: { title: 'B2 Upper Intermediate', subtitle: 'Upper Intermediate', desc: 'Discuss complex topics with confidence.' },
  C1: { title: 'C1 Advanced Debates', subtitle: 'Advanced', desc: 'Engage in deep discussions and debates.' },
  C2: { title: 'C2 Proficiency Circle', subtitle: 'Proficiency', desc: 'Master nuanced English expression.' },
};

function formatTime(dateLike) {
  try {
    return new Intl.DateTimeFormat([], {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateLike));
  } catch {
    return '';
  }
}

function buildInitials(name) {
  const text = String(name || 'L').trim();
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return text.slice(0, 2).toUpperCase();
}

function audioSrcFor(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

function avatarSrcFor(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

export default function Community() {
  const { auth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState('Connecting...');
  const [activeRoom, setActiveRoom] = useState(() => {
    const level = String(auth.level || '').toUpperCase();
    return ROOMS.includes(level) ? level : 'General';
  });

  // Practice requests & private chat state
  const [practiceRequests, setPracticeRequests] = useState([]);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [unreadMessagesByUser, setUnreadMessagesByUser] = useState({});
  const [pendingRequestsByUser, setPendingRequestsByUser] = useState({});
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateText, setPrivateText] = useState('');
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateSending, setPrivateSending] = useState(false);
  const [privateRecording, setPrivateRecording] = useState(false);
  const [privateRecordingSeconds, setPrivateRecordingSeconds] = useState(0);
  const [privateUploadingVoice, setPrivateUploadingVoice] = useState(false);
  const [showMobileLounges, setShowMobileLounges] = useState(false);
  const [showMobileLearners, setShowMobileLearners] = useState(false);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const privateMediaRecorderRef = useRef(null);
  const privateMediaStreamRef = useRef(null);
  const privateChunksRef = useRef([]);
  const privateRecordingStartedAtRef = useRef(0);
  const messagesEndRef = useRef(null);
  const privateMessagesEndRef = useRef(null);

  const currentUserId = String(auth.user?.id || '');

  // Room access control
  const canParticipateInRoom = useCallback((room) => {
    return room === 'General' || room === String(auth.level || '').toUpperCase();
  }, [auth.level]);

  const getLockMessage = useCallback((room) => {
    if (room === 'General') return null;
    const userLevel = String(auth.level || '').toUpperCase();
    if (!ROOMS.includes(userLevel)) {
      return `Complete your placement test to determine your level and join rooms.`;
    }
    return `You are currently ${userLevel}. Complete your roadmap or upgrade your level to join this room.`;
  }, [auth.level]);

  const getReadOnlyMessage = useCallback((room) => {
    if (room === 'General') return null;
    const userLevel = String(auth.level || '').toUpperCase();
    if (!ROOMS.includes(userLevel)) {
      return `Complete your placement test to participate in rooms.`;
    }
    return `You are currently ${userLevel}. You can read this room, but you need to reach ${room} to participate.`;
  }, [auth.level]);

  const appendMessage = useCallback((incoming) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === incoming.id)) return prev;
      return [...prev, incoming];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/community/messages?room=${encodeURIComponent(activeRoom)}&limit=80`);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load community messages');
    } finally {
      setLoading(false);
    }
  }, [activeRoom]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!auth.token) return undefined;

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: auth.token,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('Live');
      socket.emit('community:join', { room: activeRoom });
    });

    socket.on('disconnect', () => {
      setSocketStatus('Disconnected');
    });

    socket.on('community:joined', () => {
      setSocketStatus('Live');
    });

    socket.on('community:message:new', (message) => {
      if (message.room === activeRoom) {
        appendMessage(message);
      }
    });

    socket.on('community:error', (payload) => {
      setError(payload?.message || 'Community error');
    });

    socket.on('connect_error', (err) => {
      setSocketStatus('Offline');
      setError(err?.message || 'Could not connect to community chat');
    });

    socket.on('practice:request:new', (req) => {
      setPracticeRequests((prev) => {
        if (prev.some((r) => r.id === req.id)) return prev;
        return [req, ...prev];
      });
    });

    socket.on('practice:request:updated', (req) => {
      setPracticeRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)));
      if (activePrivateChat && activePrivateChat.id === req.id && req.status !== 'accepted') {
        setActivePrivateChat(null);
        setPrivateMessages([]);
      }
    });

    socket.on('private:message:new', (msg) => {
      if (activePrivateChat && (msg.requestId === activePrivateChat.id)) {
        setPrivateMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appendMessage, auth.token, activeRoom, activePrivateChat]);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => {
      const elapsed = Math.round((Date.now() - recordingStartedAtRef.current) / 1000);
      setRecordingSeconds(elapsed);
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!privateRecording) return undefined;
    const timer = window.setInterval(() => {
      const elapsed = Math.round((Date.now() - privateRecordingStartedAtRef.current) / 1000);
      setPrivateRecordingSeconds(elapsed);
    }, 250);
    return () => window.clearInterval(timer);
  }, [privateRecording]);

  useEffect(() => {
    if (!auth.token) return;
    
    const fetchData = async () => {
      try {
        // Fetch practice requests
        const requestsData = await apiFetch('/api/practice-requests');
        if (requestsData.success) {
          setPracticeRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
        }
        
        // Fetch notifications for indicators
        const notificationsData = await apiFetch('/api/notifications?limit=100');
        const notifications = notificationsData.notifications || [];
        
        // Process notifications to build user-specific indicators
        const unreadMessages = {};
        const pendingRequests = {};
        
        notifications.forEach(notification => {
          if (notification.is_read) return;
          
          if (notification.type === 'private_message' && notification.sender_id) {
            unreadMessages[notification.sender_id] = true;
          } else if (notification.type === 'practice_request' && notification.sender_id) {
            pendingRequests[notification.sender_id] = true;
          }
        });
        
        setUnreadMessagesByUser(unreadMessages);
        setPendingRequestsByUser(pendingRequests);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, [auth.token]);

  useEffect(() => {
    privateMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (privateMediaRecorderRef.current?.state === 'recording') {
        privateMediaRecorderRef.current.stop();
      }
      privateMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (privateMediaRecorderRef.current?.state === 'recording') {
        privateMediaRecorderRef.current.stop();
      }
      privateMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const sendTextMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current) return;

    setSending(true);
    setError('');

    socketRef.current.emit(
      'community:text:send',
      { room: activeRoom, text: trimmed },
      (ack) => {
        setSending(false);
        if (ack?.ok) {
          setText('');
          return;
        }
        setError(ack?.error || 'Failed to send message');
      },
    );
  };

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    recorder.stop();
    setRecording(false);
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const uploadVoiceBlob = useCallback(
    async (blob, durationSeconds) => {
      const formData = new FormData();
      formData.append('audio', blob, `community-${Date.now()}.webm`);
      formData.append('room', activeRoom);
      formData.append('duration', String(durationSeconds));

      setUploadingVoice(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/community/voice`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || `Voice upload failed (${response.status})`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Voice upload failed');
      } finally {
        setUploadingVoice(false);
        chunksRef.current = [];
      }
    },
    [auth.token, activeRoom],
  );

  const startRecording = async () => {
    if (recording || uploadingVoice) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      setRecording(true);
      setError('');

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError('Recording failed. Please try again.');
        setRecording(false);
      };

      recorder.onstop = async () => {
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - recordingStartedAtRef.current) / 1000),
        );
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          await uploadVoiceBlob(blob, durationSeconds);
        }
      };

      recorder.start();
    } catch (err) {
      setRecording(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not access your microphone',
      );
    }
  };

  const stopPrivateRecording = useCallback(async () => {
    const recorder = privateMediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    recorder.stop();
    setPrivateRecording(false);
    privateMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    privateMediaStreamRef.current = null;
  }, []);

  const uploadPrivateVoiceBlob = useCallback(
    async (blob, durationSeconds) => {
      if (!activePrivateChat) return;
      
      const formData = new FormData();
      formData.append('audio', blob, `private-${Date.now()}.webm`);
      formData.append('duration', String(durationSeconds));

      setPrivateUploadingVoice(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/private-messages/${activePrivateChat.id}/voice`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || `Private voice upload failed (${response.status})`);
        }

        // Add the voice message to UI immediately after successful upload
        if (data.message) {
          setPrivateMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Private voice upload failed');
      } finally {
        setPrivateUploadingVoice(false);
        privateChunksRef.current = [];
      }
    },
    [auth.token, activePrivateChat],
  );

  const startPrivateRecording = async () => {
    if (privateRecording || privateUploadingVoice || !activePrivateChat) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      privateMediaRecorderRef.current = recorder;
      privateMediaStreamRef.current = stream;
      privateChunksRef.current = [];
      privateRecordingStartedAtRef.current = Date.now();
      setPrivateRecordingSeconds(0);
      setPrivateRecording(true);
      setError('');

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          privateChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError('Private recording failed. Please try again.');
        setPrivateRecording(false);
      };

      recorder.onstop = async () => {
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - privateRecordingStartedAtRef.current) / 1000),
        );
        const blob = new Blob(privateChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          await uploadPrivateVoiceBlob(blob, durationSeconds);
        }
      };

      recorder.start();
    } catch (err) {
      setPrivateRecording(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not access your microphone',
      );
    }
  };

  const handleTextSubmit = async (event) => {
    event.preventDefault();
    await sendTextMessage();
  };

  const sortedMessages = useMemo(() => messages, [messages]);

  const openUserProfile = async (user) => {
    if (user.id === currentUserId) return;
    
    // Check if user can practice in current room
    const canParticipate = canParticipateInRoom(activeRoom);
    if (!canParticipate && activeRoom !== 'General') {
      setError(`You need to reach ${activeRoom} before practicing with learners in this room.`);
      return;
    }
    
    try {
      const data = await apiFetch(`/api/me/users/${user.id}`);
      if (data.success) {
        setProfileModalUser({ ...user, ...data.user });
      } else {
        setProfileModalUser(user);
      }
    } catch {
      setProfileModalUser(user);
    }
  };

  const sendPracticeRequest = async (receiverId) => {
    try {
      await apiFetch('/api/practice-requests', {
        method: 'POST',
        body: { receiverId, message: '' },
      });
      setProfileModalUser(null);
    } catch (err) {
      setError(err.message || 'Failed to send request');
    }
  };

  const respondRequest = async (id, status) => {
    try {
      await apiFetch(`/api/practice-requests/${id}/respond`, {
        method: 'PATCH',
        body: { status },
      });
      setPracticeRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      if (status === 'accepted') {
        const req = practiceRequests.find((r) => r.id === id);
        if (req) openPrivateChat(req);
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    }
  };

  const openPrivateChat = async (req) => {
    if (req.status !== 'accepted') return;
    setActivePrivateChat(req);
    setPrivateLoading(true);
    try {
      const data = await apiFetch(`/api/private-messages/${req.id}/messages`);
      setPrivateMessages(Array.isArray(data.messages) ? data.messages : []);
      
      // Mark messages as read for this user
      const otherUserId = String(req.senderId) === currentUserId ? req.receiverId : req.senderId;
      if (unreadMessagesByUser[otherUserId]) {
        try {
          // Mark all notifications from this user as read
          await apiFetch('/api/notifications/mark-read', {
            method: 'PATCH',
            body: JSON.stringify({ sender_id: otherUserId }),
          });
          // Update local state to remove unread indicator
          setUnreadMessagesByUser(prev => {
            const updated = { ...prev };
            delete updated[otherUserId];
            return updated;
          });
        } catch (err) {
          console.error('Failed to mark messages as read:', err);
        }
      }
    } catch {
      setPrivateMessages([]);
    } finally {
      setPrivateLoading(false);
    }
  };

  const sendPrivateText = async () => {
    const trimmed = privateText.trim();
    if (!trimmed || !activePrivateChat) return;
    setPrivateSending(true);
    setError('');
    try {
      const response = await apiFetch(`/api/private-messages/${activePrivateChat.id}/text`, {
        method: 'POST',
        body: { text: trimmed },
      });
      
      // Clear input immediately after successful API call
      setPrivateText('');
      
      // The message should appear via socket listener, but also add it locally for immediate feedback
      if (response.message) {
        setPrivateMessages((prev) => {
          if (prev.some((m) => m.id === response.message.id)) return prev;
          return [...prev, response.message];
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to send private message');
    } finally {
      setPrivateSending(false);
    }
  };

  const incomingPending = useMemo(
    () => practiceRequests.filter((r) => r.status === 'pending' && String(r.receiverId) === currentUserId),
    [practiceRequests, currentUserId],
  );

  const acceptedChats = useMemo(
    () => practiceRequests.filter((r) => r.status === 'accepted'),
    [practiceRequests],
  );

  
  const activeUsers = useMemo(() => {
    const map = new Map();
    messages.forEach((m) => {
      if (!map.has(m.sender)) {
        map.set(m.sender, {
          id: m.sender,
          name: m.senderName,
          avatar: m.senderAvatar,
        });
      }
    });
    return Array.from(map.values());
  }, [messages]);

  return (
    <div className="community-root">
      <NavBar />
      <div className="community-body">
        <SideBar />
        <main className="community-main">
          <div className="community-lounge">
            {/* Left Panel */}
            <aside className="community-left">
              <div className="community-user-card">
                <div className="community-user-avatar">
                  {auth.user?.avatar ? (
                    <img src={avatarSrcFor(auth.user.avatar)} alt={auth.user?.username} />
                  ) : (
                    <span>{buildInitials(auth.user?.username)}</span>
                  )}
                </div>
                <div className="community-user-info">
                  <strong>{auth.user?.username || 'Learner'}</strong>
                  <span>
                    {auth.level ? `Level ${auth.level}` : 'General Learner'}
                  </span>
                </div>
              </div>

              <div className="community-rooms-section">
                <h3>Public Lounges</h3>
                <div className="community-rooms-list">
                  {ROOMS.map((room) => {
                    const canParticipate = canParticipateInRoom(room);
                    const isLocked = room !== 'General' && !canParticipate;
                    
                    return (
                      <button
                        key={room}
                        type="button"
                        className={`community-room-item ${room === activeRoom ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                        onClick={() => setActiveRoom(room)}
                        title={isLocked ? getReadOnlyMessage(room) : undefined}
                      >
                        <span className="community-room-name">{ROOM_INFO[room].title}</span>
                        <span className="community-room-sub">{ROOM_INFO[room].subtitle}</span>
                        {isLocked && <span className="room-lock-icon">🔒</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Center Chat */}
            <section className="community-center">
              <header className="community-room-header">
                <div>
                  <h1>{ROOM_INFO[activeRoom].title}</h1>
                  <p>{ROOM_INFO[activeRoom].desc}</p>
                </div>
                <div className="community-status-wrap">
                  <span className={`community-status ${socketStatus === 'Live' ? 'live' : ''}`}>
                    {socketStatus}
                  </span>
                </div>
              </header>
              <div className="community-mobile-tools">
                <button type="button" className="community-mobile-tool-btn" onClick={() => setShowMobileLounges(true)}>
                  Public Lounges
                </button>
                <button type="button" className="community-mobile-tool-btn" onClick={() => setShowMobileLearners(true)}>
                  Active Learners
                </button>
              </div>

              <div className="community-chat-body">
                <div className="community-messages">
                  {loading ? <div className="community-empty">Loading messages...</div> : null}
                  {!loading && sortedMessages.length === 0 ? (
                    <div className="community-empty">
                      No messages yet. Start the conversation.
                    </div>
                  ) : null}
                  {sortedMessages.map((message) => {
                    const mine = String(message.sender) === currentUserId;
                    return (
                      <article
                        key={message.id}
                        className={`community-message ${mine ? 'mine' : ''}`}
                      >
                        <div
                          className="community-avatar"
                          onClick={() => openUserProfile({ id: message.sender, name: message.senderName, avatar: message.senderAvatar })}
                          style={{ cursor: 'pointer' }}
                          title="View profile"
                        >
                          {message.senderAvatar ? (
                            <img src={avatarSrcFor(message.senderAvatar)} alt={message.senderName} />
                          ) : (
                            <span>{buildInitials(message.senderName)}</span>
                          )}
                        </div>
                        <div className="community-bubble">
                          <div className="community-message-meta">
                            <strong>{message.senderName}</strong>
                            <span>{formatTime(message.createdAt)}</span>
                          </div>
                          {message.type === 'text' ? (
                            <p className="community-text">{message.text}</p>
                          ) : (
                            <div className="community-voice">
                              <audio controls preload="none" src={audioSrcFor(message.audioUrl)}>
                                <track kind="captions" />
                              </audio>
                              <span className="community-voice-label">
                                Voice message{message.duration ? ` · ${message.duration}s` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="community-composer-wrap">
                  {error ? <div className="community-error">{error}</div> : null}
                  {!canParticipateInRoom(activeRoom) && (
                    <div className="community-readonly-notice">
                      {getReadOnlyMessage(activeRoom)}
                    </div>
                  )}
                  <form className="community-composer" onSubmit={handleTextSubmit}>
                    <textarea
                      className="community-input"
                      rows={2}
                      maxLength={1000}
                      placeholder={canParticipateInRoom(activeRoom) ? `Message ${ROOM_INFO[activeRoom].title}...` : 'This room is read-only'}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      disabled={sending || uploadingVoice || !canParticipateInRoom(activeRoom)}
                    />
                    <div className="community-actions">
                      <button
                        type="button"
                        className={`community-record ${recording ? 'recording' : ''}`}
                        onClick={recording ? stopRecording : startRecording}
                        disabled={uploadingVoice || !canParticipateInRoom(activeRoom)}
                      >
                        {recording ? `Stop (${recordingSeconds}s)` : uploadingVoice ? 'Uploading...' : 'Record Voice'}
                      </button>
                      <button
                        type="submit"
                        className="community-send"
                        disabled={!text.trim() || sending || uploadingVoice || !canParticipateInRoom(activeRoom)}
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* Right Panel */}
            <aside className="community-right">
              <div className="community-right-header">
                <h3>Active Learners</h3>
                <button
                  type="button"
                  className="requests-toggle-btn"
                  onClick={() => setShowRequestsPanel(true)}
                  title="Practice Requests"
                >
                  <span className="material-symbols-outlined">mail</span>
                  {(incomingPending.length > 0 || Object.keys(unreadMessagesByUser).length > 0) && (
                    <span className="requests-badge">
                      {incomingPending.length + Object.keys(unreadMessagesByUser).length}
                    </span>
                  )}
                </button>
              </div>
              <div className="community-active-list">
                {activeUsers.length === 0 ? (
                  <p className="community-active-empty">No active learners yet</p>
                ) : (
                  activeUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="community-active-user"
                      onClick={() => openUserProfile(user)}
                      data-user-id={user.id}
                    >
                      <div className="community-active-avatar">
                        {user.avatar ? (
                          <img src={avatarSrcFor(user.avatar)} alt={user.name} />
                        ) : (
                          <span>{buildInitials(user.name)}</span>
                        )}
                      </div>
                      <span className="community-active-name">{user.name}</span>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
      {/* Mini Profile Modal */}
      {profileModalUser && (
        <div className="profile-modal-overlay" onClick={() => setProfileModalUser(null)}>
          <div className="profile-modal profile-modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Learner Profile</h3>
              <button type="button" className="profile-modal-close" onClick={() => setProfileModalUser(null)}>×</button>
            </div>
            <div className="profile-modal-body">
              <div className="profile-modal-avatar" style={{ cursor: 'default' }}>
                {profileModalUser.avatar ? (
                  <img src={avatarSrcFor(profileModalUser.avatar)} alt={profileModalUser.name || profileModalUser.username} />
                ) : (
                  <span>{buildInitials(profileModalUser.name || profileModalUser.username)}</span>
                )}
              </div>
              <p className="profile-modal-name">{profileModalUser.name || profileModalUser.username}</p>
              <p className="profile-modal-meta">Level: {auth.level || 'General'}</p>
              <button
                type="button"
                className="profile-modal-upload-btn"
                onClick={() => sendPracticeRequest(profileModalUser.id)}
                disabled={profileModalUser.id === currentUserId}
              >
                Send Practice Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests Panel */}
      {showRequestsPanel && (
        <div className="requests-panel-overlay" onClick={() => setShowRequestsPanel(false)}>
          <div className="requests-panel" onClick={(e) => e.stopPropagation()}>
            <div className="requests-panel-header">
              <h3>Practice Requests</h3>
              <button type="button" className="profile-modal-close" onClick={() => setShowRequestsPanel(false)}>×</button>
            </div>
            <div className="requests-panel-body">
              {practiceRequests.length === 0 ? (
                <p className="community-active-empty">No requests yet</p>
              ) : (
                practiceRequests.map((req) => {
                  const isIncoming = String(req.receiverId) === currentUserId;
                  const otherName = isIncoming ? req.senderName : req.receiverName;
                  const otherAvatar = isIncoming ? req.senderAvatar : req.receiverAvatar;
                  const otherUserId = isIncoming ? req.senderId : req.receiverId;
                  const hasUnreadMessages = unreadMessagesByUser[otherUserId];
                  return (
                    <div key={req.id} className="request-item">
                      <div className="community-active-avatar">
                        {otherAvatar ? (
                          <img src={avatarSrcFor(otherAvatar)} alt={otherName} />
                        ) : (
                          <span>{buildInitials(otherName)}</span>
                        )}
                        {hasUnreadMessages && (
                          <span className="request-unread-badge">New</span>
                        )}
                      </div>
                      <div className="request-info">
                        <div className="request-name-row">
                          <strong>{otherName}</strong>
                          {hasUnreadMessages && (
                            <span className="request-unread-indicator">•</span>
                          )}
                        </div>
                        <span>{req.status === 'pending' ? (isIncoming ? 'Incoming request' : 'Sent request') : req.status}</span>
                        {req.message && (
                          <div className="request-message-preview">{req.message.substring(0, 80)}{req.message.length > 80 ? '...' : ''}</div>
                        )}
                      </div>
                      <div className="request-actions">
                        {req.status === 'pending' && isIncoming && (
                          <>
                            <button type="button" className="community-send" onClick={() => respondRequest(req.id, 'accepted')}>Accept</button>
                            <button type="button" className="community-record" onClick={() => respondRequest(req.id, 'declined')}>Decline</button>
                          </>
                        )}
                        {req.status === 'accepted' && (
                          <button type="button" className="community-send" onClick={() => openPrivateChat(req)}>Open Chat</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showMobileLounges && (
        <div className="mobile-community-panel-overlay" onClick={() => setShowMobileLounges(false)}>
          <div className="mobile-community-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-community-panel-header">
              <h3>Public Lounges</h3>
              <button type="button" className="profile-modal-close" onClick={() => setShowMobileLounges(false)}>×</button>
            </div>
            <div className="mobile-community-panel-body">
              {ROOMS.map((room) => {
                const canParticipate = canParticipateInRoom(room);
                const isLocked = room !== 'General' && !canParticipate;
                return (
                  <button
                    key={room}
                    type="button"
                    className={`community-room-item ${room === activeRoom ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => {
                      setActiveRoom(room);
                      setShowMobileLounges(false);
                    }}
                    title={isLocked ? getReadOnlyMessage(room) : undefined}
                  >
                    <span className="community-room-name">{ROOM_INFO[room].title}</span>
                    <span className="community-room-sub">{ROOM_INFO[room].subtitle}</span>
                    {isLocked && <span className="room-lock-icon">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showMobileLearners && (
        <div className="mobile-community-panel-overlay" onClick={() => setShowMobileLearners(false)}>
          <div className="mobile-community-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-community-panel-header">
              <h3>Active Learners</h3>
              <button type="button" className="profile-modal-close" onClick={() => setShowMobileLearners(false)}>×</button>
            </div>
            <div className="mobile-community-panel-body">
              {activeUsers.length === 0 ? (
                <p className="community-active-empty">No active learners yet</p>
              ) : (
                activeUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="community-active-user"
                    onClick={() => {
                      openUserProfile(user);
                      setShowMobileLearners(false);
                    }}
                    data-user-id={user.id}
                  >
                    <div className="community-active-avatar">
                      {user.avatar ? (
                        <img src={avatarSrcFor(user.avatar)} alt={user.name} />
                      ) : (
                        <span>{buildInitials(user.name)}</span>
                      )}
                    </div>
                    <span className="community-active-name">{user.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Private Chat Overlay */}
      {activePrivateChat && (
        <div className="private-chat-overlay" onClick={() => setActivePrivateChat(null)}>
          <div className="private-chat" onClick={(e) => e.stopPropagation()}>
            <div className="private-chat-header">
              <div className="private-chat-title">
                <span>Practice Chat</span>
                <span className="private-chat-sub">
                  {String(activePrivateChat.senderId) === currentUserId ? activePrivateChat.receiverName : activePrivateChat.senderName}
                </span>
              </div>
              <button type="button" className="profile-modal-close" onClick={() => setActivePrivateChat(null)}>×</button>
            </div>
            <div className="private-chat-messages">
              {privateLoading ? <div className="community-empty">Loading…</div> : null}
              {!privateLoading && privateMessages.length === 0 ? (
                <div className="community-empty">Start your practice conversation</div>
              ) : null}
              {privateMessages.map((msg) => {
                const mine = String(msg.senderId) === currentUserId;
                return (
                  <div key={msg.id} className={`community-message ${mine ? 'mine' : ''}`}>
                    <div className="community-bubble">
                      <div className="community-message-meta">
                        <strong>{msg.senderName || 'Learner'}</strong>
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                      {msg.type === 'text' ? (
                        <p className="community-text">{msg.text}</p>
                      ) : (
                        <div className="community-voice">
                          <audio controls preload="none" src={audioSrcFor(msg.audioUrl)}>
                            <track kind="captions" />
                          </audio>
                          <span className="community-voice-label">Voice message{msg.duration ? ` · ${msg.duration}s` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={privateMessagesEndRef} />
            </div>
            <div className="private-chat-composer">
              <input
                type="text"
                className="community-input"
                placeholder="Type a message…"
                value={privateText}
                onChange={(e) => setPrivateText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendPrivateText(); }}
                disabled={privateSending || privateUploadingVoice}
              />
              <div className="community-actions">
                <button
                  type="button"
                  className={`community-record ${privateRecording ? 'recording' : ''}`}
                  onClick={privateRecording ? stopPrivateRecording : startPrivateRecording}
                  disabled={privateUploadingVoice}
                >
                  {privateRecording ? `Stop (${privateRecordingSeconds}s)` : privateUploadingVoice ? 'Uploading...' : 'Record Voice'}
                </button>
                <button
                  type="button"
                  className="community-send"
                  disabled={!privateText.trim() || privateSending || privateUploadingVoice}
                  onClick={sendPrivateText}
                >
                  {privateSending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AiChat />
    </div>
  );
}
