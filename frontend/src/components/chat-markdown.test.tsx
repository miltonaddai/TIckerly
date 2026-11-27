import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMarkdown } from "@/components/chat-markdown";

function html(text: string) {
  return render(<ChatMarkdown text={text} />).container;
}

describe("ChatMarkdown", () => {
  it("renders bold, italic and inline code", () => {
    const root = html("**PEAR** is *up* today, see `vs50`");
    expect(root.querySelector("strong")?.textContent).toBe("PEAR");
    expect(root.querySelector("em")?.textContent).toBe("up");
    expect(root.querySelector("code")?.textContent).toBe("vs50");
  });

  it("renders bullet lists", () => {
    const items = html("Top movers:\n- **NVDU** +4%\n- **TSLO** +3%").querySelectorAll("ul > li");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe("NVDU +4%");
  });

  it("renders ordered lists", () => {
    const root = html("1. First\n2. Second");
    expect(root.querySelectorAll("ol > li")).toHaveLength(2);
    expect(root.querySelector("ul")).toBeNull();
  });

  it("splits paragraphs on blank lines and keeps line breaks inside them", () => {
    const root = html("Line one\nline two\n\nSecond paragraph");
    const paragraphs = root.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].querySelectorAll("br")).toHaveLength(1);
  });

  it("leaves plain text untouched", () => {
    expect(html("Just text.").textContent).toBe("Just text.");
  });
});
