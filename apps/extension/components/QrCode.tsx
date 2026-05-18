import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  value: string;
  size?: number;
}

/** DOM QR — renders the value to a canvas via the `qrcode` package.
 *  The extension is React DOM (not React Native), so it does not use
 *  react-native-qrcode-svg. */
export function QrCode({ value, size = 200 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: "#050505", light: "#ededed" },
    }).catch(() => {
      /* invalid value — leave the canvas blank rather than throw */
    });
  }, [value, size]);

  return (
    <div className="bg-qb-bone rounded-lg p-3 inline-flex">
      <canvas ref={ref} width={size} height={size} aria-label="Quanta Account address QR" />
    </div>
  );
}
