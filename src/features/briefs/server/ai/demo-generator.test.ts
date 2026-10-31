import { describe, expect, it } from "vitest";
import { BriefContentSchema } from "../../schemas";
import { DemoBriefGenerator } from "./demo-generator";

describe("DemoBriefGenerator", () => {
  const gen = new DemoBriefGenerator();

  it("splits facts and tasks", async () => {
    const out = await gen.generate("Planning call.\n- Ali will fix the Safari bug by Friday.\n- Launch stays on the 15th.");
    expect(out.title).toBe("Planning call");
    expect(out.actionItems).toEqual(["Ali will fix the Safari bug by Friday"]);
    expect(out.summary).toBe("Planning call. Launch stays on the 15th.");
  });

  it("always returns content that matches the AI schema", async () => {
    const out = await gen.generate("Just some notes with no tasks at all in them.");
    expect(BriefContentSchema.safeParse(out).success).toBe(true);
    expect(out.actionItems.length).toBeGreaterThan(0);
  });
});
