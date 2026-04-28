import { describe, it, expect, vi } from "vitest";

describe("Botão imprimir", () => {
  it("deve chamar window.print ao clicar", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    document.body.innerHTML = `<button id="printBtn">Imprimir</button>`;

    document
      .getElementById("printBtn")
      .addEventListener("click", () => window.print());

    document.getElementById("printBtn").click();

    expect(printMock).toHaveBeenCalled();
  });
});
