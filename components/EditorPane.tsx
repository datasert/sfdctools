import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface EditorPaneActionContextValue {
  setAction: (id: string, action: ReactNode | null) => void;
}

const EditorPaneActionContext = createContext<EditorPaneActionContextValue | null>(null);

export function useEditorPaneActionContext() {
  return useContext(EditorPaneActionContext);
}

interface EditorPaneProps {
  label: ReactNode;
  count?: number | string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function EditorPane({
  label,
  count,
  children,
  className = "",
  headerRight,
}: EditorPaneProps) {
  const [actions, setActions] = useState<Record<string, ReactNode>>({});

  const setAction = useCallback((id: string, action: ReactNode | null) => {
    setActions((current) => {
      const next = { ...current };
      if (action === null) {
        delete next[id];
      } else {
        next[id] = action;
      }
      return next;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      setAction,
    }),
    [setAction],
  );

  const headerActions = useMemo(() => Object.values(actions), [actions]);

  return (
    <EditorPaneActionContext.Provider value={contextValue}>
      <div className={`flex h-full min-h-0 flex-col ${className}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              {label}
            </label>
            {headerActions}
            {headerRight}
          </div>
          {count !== undefined && (
            <span className="text-xs text-[var(--text-tertiary)]">
              {count}
            </span>
          )}
        </div>
        {children}
      </div>
    </EditorPaneActionContext.Provider>
  );
}
