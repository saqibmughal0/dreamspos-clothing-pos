// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import moment from "moment";
import $ from "jquery";

describe("Moment and DateRangePicker Interoperability", () => {
  it("moment should be a callable function with valid date manipulation methods", () => {
    expect(typeof moment).toBe("function");
    const now = moment();
    expect(typeof now.format).toBe("function");
    expect(typeof now.subtract).toBe("function");
    expect(typeof now.startOf).toBe("function");
    expect(typeof now.endOf).toBe("function");

    const formatted = now.format("MM/DD/YYYY");
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("bootstrap-daterangepicker loads successfully and registers jQuery plugin", async () => {
    // Ensure jQuery is on global/window if required by plugin
    (globalThis as any).jQuery = $;
    (globalThis as any).$ = $;
    (globalThis as any).moment = moment;

    await import("bootstrap-daterangepicker");

    expect(typeof ($.fn as any).daterangepicker).toBe("function");
  });

  it("daterangepicker initializes on an element without throwing moment is not a function", async () => {
    // Create a mock DOM element container
    const div = document.createElement("div");
    document.body.appendChild(div);

    expect(() => {
      ($(div) as any).daterangepicker({
        startDate: moment().subtract(7, "days"),
        endDate: moment(),
        ranges: {
          Today: [moment(), moment()],
          "Last 7 Days": [moment().subtract(6, "days"), moment()],
          "This Month": [moment().startOf("month"), moment().endOf("month")]
        }
      });
    }).not.toThrow();

    const picker = ($(div) as any).data("daterangepicker");
    expect(picker).toBeDefined();
    expect(picker.startDate).toBeDefined();
    expect(picker.endDate).toBeDefined();

    // Clean up
    picker.remove();
    div.remove();
  });
});
