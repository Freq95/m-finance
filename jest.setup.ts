// Jest setup for jsdom-backed tests.
// Some DOM APIs are not implemented by jsdom (e.g. URL.createObjectURL).

import "@testing-library/jest-dom";

// React 18: enable act() environment to avoid warnings/errors.
// See: https://react.dev/reference/react-dom/test-utils/act
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Basic RAF polyfill for components that use requestAnimationFrame (e.g. tooltips).
if (typeof globalThis.requestAnimationFrame !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
}
if (typeof globalThis.cancelAnimationFrame !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}

declare const URL: {
  createObjectURL?: (obj: unknown) => string;
  revokeObjectURL?: (url: string) => void;
};

// Polyfill URL.createObjectURL / revokeObjectURL for tests that spy on them.
if (typeof URL !== "undefined") {
  if (typeof URL.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "blob:jest",
      writable: true,
    });
  }
  if (typeof URL.revokeObjectURL !== "function") {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => undefined,
      writable: true,
    });
  }
}

// Polyfill Blob.text() (needed by some jsdom environments).
if (typeof Blob !== "undefined" && typeof Blob.prototype.text !== "function") {
  // eslint-disable-next-line no-extend-native
  Blob.prototype.text = function text(): Promise<string> {
    if (typeof FileReader !== "undefined") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob"));
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.readAsText(this);
      });
    }

    // Node fallback
    const maybeArrayBuffer = (this as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
    if (typeof maybeArrayBuffer === "function") {
      return maybeArrayBuffer.call(this).then((buf) => Buffer.from(buf).toString("utf8"));
    }

    return Promise.resolve("");
  };
}

// jsdom triggers "navigation not implemented" when clicking anchors.
// For download-link tests, make anchor clicks a no-op by default.
if (typeof HTMLAnchorElement !== "undefined") {
  Object.defineProperty(HTMLAnchorElement.prototype, "click", {
    value: function click() {
      // no-op
    },
    writable: true,
  });
}

// Next.js runtime mocks for Jest/RTL.
const mockRouterReplace = jest.fn();
const mockUsePathname = jest.fn(() => "/");

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => mockUsePathname(),
  __mock: {
    mockRouterReplace,
    mockUsePathname,
  },
}));

jest.mock("next/font/google", () => ({
  Poppins: () => ({
    className: "",
    variable: "",
  }),
}));

jest.mock("next/image", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function NextImage(props: any) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { src, alt, ...rest } = props;
    return React.createElement("img", { src, alt, ...rest });
  };
});

// Recharts often depends on layout/ResizeObserver. Mocking is enough for unit/UI tests.
jest.mock("recharts", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react");
  const Null = () => null;
  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children ?? null),
    BarChart: Null,
    Bar: Null,
    XAxis: Null,
    YAxis: Null,
    Tooltip: Null,
    CartesianGrid: Null,
    LineChart: Null,
    Line: Null,
    PieChart: Null,
    Pie: Null,
    Cell: Null,
    Legend: Null,
    ReferenceLine: Null,
    Rectangle: Null,
  };
});
