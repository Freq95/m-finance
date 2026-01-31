/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

jest.mock("@/components/monthly-input/MonthlyInputClient", () => ({
  MonthlyInputClient: () => <div data-testid="monthly-input-client" />,
}));

import MonthlyInputPage from "../page";

describe("monthly input page", () => {
  it("renders MonthlyInputClient", () => {
    render(<MonthlyInputPage />);
    expect(screen.getByTestId("monthly-input-client")).toBeInTheDocument();
  });
});

