import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

test("Field wires the label, required and error to the control for assistive tech", () => {
  render(
    <Field label="Email" error="Email inválido" required>
      <Input defaultValue="x" type="email" />
    </Field>,
  );

  const input = screen.getByLabelText(/Email/);
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute("required");

  const error = screen.getByRole("alert");
  expect(error).toHaveTextContent("Email inválido");
  expect(input).toHaveAttribute("aria-describedby", error.id);
});

test("Pagination flags the current page and emits page changes", async () => {
  const onPageChange = vi.fn();
  render(<Pagination page={3} pageCount={12} onPageChange={onPageChange} />);

  expect(screen.getByRole("button", { name: "3" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));
  expect(onPageChange).toHaveBeenCalledWith(4);
});

test("Pagination renders nothing for a single page", () => {
  const { container } = render(
    <Pagination page={1} pageCount={1} onPageChange={() => {}} />,
  );
  expect(container).toBeEmptyDOMElement();
});
