import { Button } from "./Button";

interface ActionButtonsProps {
  onSample?: () => void;
  onCopy?: () => void;
  onSwap?: () => void;
  onClear?: () => void;
  copyDisabled?: boolean;
  swapDisabled?: boolean;
  className?: string;
}

export function ActionButtons({
  onSample,
  onCopy,
  onSwap,
  onClear,
  copyDisabled = false,
  swapDisabled = false,
  className = "",
}: ActionButtonsProps) {
  const handleReset = () => {
    if (!onClear) return;
    const confirmed = window.confirm(
      "This will reset the tool configuration and remove all input data. Continue?"
    );
    if (!confirmed) return;
    onClear();
  };

  return (
    <div className={`flex items-center gap-2 ml-auto ${className}`}>
      {onSample && (
        <Button onClick={onSample} variant="secondary" size="sm">
          Load Sample
        </Button>
      )}
      {onCopy && (
        <Button onClick={onCopy} variant="secondary" size="sm" disabled={copyDisabled}>
          Copy Output
        </Button>
      )}
      {onSwap && (
        <Button onClick={onSwap} variant="secondary" size="sm" disabled={swapDisabled}>
          Swap
        </Button>
      )}
      {onClear && (
        <Button onClick={handleReset} variant="secondary" size="sm">
          Reset
        </Button>
      )}
    </div>
  );
}
