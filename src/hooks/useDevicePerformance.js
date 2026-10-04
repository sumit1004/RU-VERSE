import { useMemo } from 'react';
import { getQuality } from '../utils/performance';
export function useDevicePerformance() { return useMemo(getQuality, []); }
