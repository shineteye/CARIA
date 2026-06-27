import RoadmapStage from './RoadmapStage';

const STAGE_NAMES = ['JHS', 'BECE', 'SHS', 'WASSCE', 'University'];

export default function RoadmapPanel({ stages }) {
  return (
    <aside className="roadmap-panel">
      <div className="roadmap-panel__header">
        <h2 className="roadmap-panel__title">Your Path</h2>
        <p className="roadmap-panel__subtitle">Updates as you chat</p>
      </div>

      <div className="roadmap-stages">
        {STAGE_NAMES.map((name, index) => {
          const stageData = stages.find((s) => s.name === name) || {
            name,
            status: 'locked',
            detail: '',
            subDetail: '',
          };

          const nextStageName = STAGE_NAMES[index + 1];
          const nextStage = nextStageName
            ? stages.find((s) => s.name === nextStageName)
            : null;

          const lineAnimate = nextStage ? nextStage.status !== 'locked' : false;

          return (
            <RoadmapStage
              key={name}
              stage={name}
              status={stageData.status}
              detail={stageData.detail}
              subDetail={stageData.subDetail}
              isLast={index === STAGE_NAMES.length - 1}
              lineAnimate={lineAnimate}
            />
          );
        })}
      </div>
    </aside>
  );
}
