import { useState, useCallback, useRef } from 'react';
import type { Rive, StateMachineInput } from '@rive-app/react-canvas-lite';

/**
 * Controller hook providing safe, memoized access to Rive State Machine inputs.
 */
export function useRiveController(stateMachineName?: string) {
  const [riveInstance, setRiveInstance] = useState<Rive | null>(null);
  const inputsCache = useRef<Map<string, StateMachineInput>>(new Map());

  const onRiveReady = useCallback((rive: Rive) => {
    setRiveInstance(rive);
    inputsCache.current.clear();
  }, []);

  const getInput = useCallback(
    (name: string): StateMachineInput | null => {
      if (!riveInstance) return null;
      if (inputsCache.current.has(name)) {
        return inputsCache.current.get(name)!;
      }

      // Try searching inside state machine
      const smName = stateMachineName || riveInstance.stateMachineNames?.[0];
      if (!smName) return null;

      try {
        const inputs = riveInstance.stateMachineInputs(smName);
        if (!inputs) return null;
        const target = inputs.find((i) => i.name === name);
        if (target) {
          inputsCache.current.set(name, target);
          return target;
        }
      } catch (err) {
        console.warn(`[useRiveController] Error fetching input "${name}":`, err);
      }
      return null;
    },
    [riveInstance, stateMachineName]
  );

  const setBoolean = useCallback(
    (name: string, value: boolean) => {
      const input = getInput(name);
      if (input) {
        input.value = value;
      }
    },
    [getInput]
  );

  const setNumber = useCallback(
    (name: string, value: number) => {
      const input = getInput(name);
      if (input) {
        input.value = value;
      }
    },
    [getInput]
  );

  const fireTrigger = useCallback(
    (name: string) => {
      const input = getInput(name);
      if (input) {
        input.fire();
      }
    },
    [getInput]
  );

  return {
    rive: riveInstance,
    onRiveReady,
    setBoolean,
    setNumber,
    fireTrigger,
  };
}
