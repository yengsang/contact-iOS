import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import { emptyLaunchContext, LaunchContext } from '../types';
import {
  clearStoredLaunchContext,
  mergeLaunchContext,
  parseLaunchUrl,
  readStoredLaunchContext,
  writeStoredLaunchContext,
} from './storage';

export function useLaunchContext() {
  const [launchContext, setLaunchContext] = useState<LaunchContext>(emptyLaunchContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const [storedContext, initialUrl] = await Promise.all([
        readStoredLaunchContext(),
        Linking.getInitialURL(),
      ]);

      if (!mounted) {
        return;
      }

      const incomingContext = parseLaunchUrl(initialUrl);
      const resolvedContext = mergeLaunchContext(storedContext, incomingContext);
      setLaunchContext(resolvedContext);
      setLoading(false);
      await writeStoredLaunchContext(resolvedContext);
    }

    void initialize();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const incomingContext = parseLaunchUrl(url);
      setLaunchContext((current) => {
        const next = mergeLaunchContext(current, incomingContext);
        void writeStoredLaunchContext(next);
        return next;
      });
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const patchLaunchContext = useCallback(async (patch: Partial<LaunchContext>) => {
    const next = mergeLaunchContext(launchContext, patch);
    setLaunchContext(next);
    await writeStoredLaunchContext(next);
    return next;
  }, [launchContext]);

  const clearLaunchContext = useCallback(async () => {
    setLaunchContext(emptyLaunchContext);
    await clearStoredLaunchContext();
  }, []);

  const hasLaunchSelection = useMemo(() => {
    return Boolean(launchContext.qrToken || launchContext.referralCode);
  }, [launchContext]);

  return {
    launchContext,
    hasLaunchSelection,
    loading,
    patchLaunchContext,
    clearLaunchContext,
  };
}
