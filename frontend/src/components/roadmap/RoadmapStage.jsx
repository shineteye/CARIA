import RoadmapLine from './RoadmapLine';

export default function RoadmapStage({ stage, status, detail, subDetail, isLast, lineAnimate }) {
  const isLocked = status === 'locked';

  return (
    <div className="roadmap-stage">
      <div
        className={`roadmap-stage__card ${
          status === 'active' ? 'roadmap-stage__card--active' : ''
        } ${status === 'complete' ? 'roadmap-stage__card--complete' : ''}`}
      >
        <div className={`roadmap-stage__name ${isLocked ? 'roadmap-stage__name--locked' : ''}`}>
          {stage}
        </div>
        {!isLocked && detail && (
          <div className="roadmap-stage__detail">{detail}</div>
        )}
        {!isLocked && subDetail && (
          <div className="roadmap-stage__sub-detail">{subDetail}</div>
        )}
      </div>
      {!isLast && <RoadmapLine animate={lineAnimate} />}
    </div>
  );
}
