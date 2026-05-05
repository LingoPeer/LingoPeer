import React, { useState } from 'react';
import {  useParams } from 'react-router-dom';
import roadmapData from '../data/roadmap.json';
import '../Pages/LessonPage.css';



export default function LessonSideBar () {
  // const [lessons, setLessons] = useState([]);
  // const [currentLesson, setCurrentLesson] = useState(null);
  const { unitId, lessonId } = useParams(); // ✅ NEW

  // useEffect(() => {
  //   setLessons(lessonsData.lessons);
  //   const activeLesson = lessonsData.lessons.find(l => l.content);
  //   setCurrentLesson(activeLesson);
  // }, []);

  const unit = roadmapData.units.find(u => u.id === Number(unitId));
  const lessons = unit.lessons;


  // const initialLesson =
  //   lessons.find(l => l.content) || lessons[1];

  const [currentLesson, setCurrentLesson] = useState(lessons.find(l => l.id === Number(lessonId)));



  const handleLessonClick = (lesson) => {
    if (lesson.content) {
      setCurrentLesson(lesson);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!currentLesson) return null;

  return (
    <>
    <div className="app-container">
      {/* NavBar */}
      

      {/* Sidebar */}
      <aside className={`sidebar`}>
        <div className="sidebar-header">
          <h2>Current Lessons</h2>
          <p className="sidebar-subtitle">English Grammar</p>
        </div>
        
        <nav className="lessons-nav">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              className={`lesson-item ${currentLesson.id === lesson.id ? 'active' : ''} ${lesson.completed ? 'completed' : ''}`}
              onClick={() => handleLessonClick(lesson)}
              disabled={!lesson.content}
            >
              <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="lesson-info">
                <h3>{lesson.title}</h3>
                <div className="progress-mini">
                  <div 
                    className="progress-fill-mini" 
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>
              {lesson.completed && (
                <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </nav>
      </aside>

    </div>
    </>
  );
};