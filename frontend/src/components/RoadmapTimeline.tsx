import React from 'react';
import { WeeklyPlan } from '../types/jopfit';

interface RoadmapTimelineProps {
  plans: WeeklyPlan[];
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ plans = [] }) => {
  if (plans.length === 0) {
    return <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>추천된 로드맵 일정이 존재하지 않습니다.</p>;
  }

  // Sort plans by week
  const sortedPlans = [...plans].sort((a, b) => a.week - b.week);

  return (
    <div className="timeline">
      {sortedPlans.map((plan) => (
        <div className="timeline-item" key={plan.week}>
          <div className="timeline-week-pill">{plan.week}주차</div>
          <div className="timeline-body">
            <div className="timeline-goal">{plan.goal}</div>
            <div className="timeline-detail">{plan.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
