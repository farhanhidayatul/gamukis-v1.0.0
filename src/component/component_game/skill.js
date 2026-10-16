import React from 'react';
import './skill.css';

export const skillTypes = [
  { name: 'LUMEN', className: 'skill-lumen' },
  { name: 'EMBER', className: 'skill-ember' },
  { name: 'TIDAL', className: 'skill-tidal' },
  { name: 'THORN', className: 'skill-thorn' },
  { name: 'VOID', className: 'skill-void' },
  { name: 'NOVA', className: 'skill-nova' }
];

export const SkillEffect = ({ active, skillIndex = 0 }) => {
  if (!active) return null;

  const skill = skillTypes[skillIndex] || skillTypes[0];

  return (
    <div className={`skill-effect ${skill.className}`} aria-label={skill.name}>
      <span className="skill-ring skill-ring-one"></span>
      <span className="skill-ring skill-ring-two"></span>
      <span className="skill-core"></span>
    </div>
  );
};

const Skills = ({ skills = [] }) => (
  <div className="skills">
    <h3>Skills</h3>
    <p>Kompetensi yang akan kamu kembangkan.</p>
    <div className="skills-grid">
      {skills.map((skill) => <div className="skill-box" key={skill} aria-label={skill}>{skill}</div>)}
    </div>
  </div>
);

export default Skills;

