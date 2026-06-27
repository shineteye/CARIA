import { useState, useCallback } from 'react';

const INITIAL_STAGES = [
  { name: 'JHS', status: 'locked', detail: '', subDetail: '' },
  { name: 'BECE', status: 'locked', detail: '', subDetail: '' },
  { name: 'SHS', status: 'locked', detail: '', subDetail: '' },
  { name: 'WASSCE', status: 'locked', detail: '', subDetail: '' },
  { name: 'University', status: 'locked', detail: '', subDetail: '' },
];

const STAGE_ORDER = ['JHS', 'BECE', 'SHS', 'WASSCE', 'University'];

export default function useRoadmap() {
  const [stages, setStages] = useState(INITIAL_STAGES);

  const updateStage = useCallback((roadmapUpdate) => {
    if (!roadmapUpdate?.stage) return;

    setStages((prev) => {
      const targetIndex = STAGE_ORDER.indexOf(roadmapUpdate.stage);
      if (targetIndex === -1) return prev;

      return prev.map((stage, index) => {
        if (stage.name === roadmapUpdate.stage) {
          return {
            ...stage,
            status: 'active',
            detail: roadmapUpdate.detail || stage.detail,
            subDetail: roadmapUpdate.subDetail || stage.subDetail,
            lineJustActivated: true,
          };
        }

        if (index < targetIndex && stage.status === 'locked') {
          return { ...stage, status: 'complete' };
        }

        if (index < targetIndex && stage.status === 'active') {
          return { ...stage, status: 'complete', lineJustActivated: false };
        }

        return { ...stage, lineJustActivated: false };
      });
    });
  }, []);

  return { stages, updateStage };
}
