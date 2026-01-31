/** @jest-environment jsdom */
import { render, waitFor } from "@testing-library/react";

import SettingsRedirectPage from "../page";

describe("settings redirect page", () => {
  it("redirects to / on mount", async () => {
    const nav = require("next/navigation") as {
      __mock: { mockRouterReplace: jest.Mock };
    };
    nav.__mock.mockRouterReplace.mockClear();

    render(<SettingsRedirectPage />);

    await waitFor(() => {
      expect(nav.__mock.mockRouterReplace).toHaveBeenCalledWith("/");
    });
  });
});

