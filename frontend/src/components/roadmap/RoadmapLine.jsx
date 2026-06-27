export default function RoadmapLine({ animate }) {
  return (
    <div className="roadmap-line" aria-hidden="true">
      <div className="roadmap-line__track" />
      {animate && <div className="roadmap-line__fill roadmap-line__fill--animate" />}
    </div>
  );
}
