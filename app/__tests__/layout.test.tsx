import React from "react";
import RootLayout from "../layout";

describe("RootLayout", () => {
  it("wraps children with html/body/AppShell", () => {
    const tree = RootLayout({ children: <div data-testid="child" /> });
    expect(React.isValidElement(tree)).toBe(true);
    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("en");
  });
});

