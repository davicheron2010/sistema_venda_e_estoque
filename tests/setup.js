import { describe, it, expect, vi } from "vitest";

describe("Botão imprimir", () => {
  it("deve chamar window.print ao clicar", () => {
    // mock
    window.print = vi.fn();

    document.body.innerHTML = `
      <button onclick="window.print()">Imprimir / PDF</button>
    `;

    const button = document.querySelector("button");

    button.click();

    expect(window.print).toHaveBeenCalled();
  });
});
