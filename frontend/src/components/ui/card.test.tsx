import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";

describe("Card Components", () => {
  it("renders Card with content", () => {
    render(
      <Card data-testid="card">Card Content</Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("renders Card with custom className", () => {
    render(
      <Card className="custom-card" data-testid="card">Content</Card>
    );

    expect(screen.getByTestId("card")).toHaveClass("custom-card");
  });

  it("renders CardHeader", () => {
    render(
      <CardHeader data-testid="header">Header Content</CardHeader>
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    render(
      <CardFooter data-testid="footer">Footer Content</CardFooter>
    );

    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders CardTitle", () => {
    render(
      <CardTitle data-testid="title">Title</CardTitle>
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Title");
  });

  it("renders CardDescription", () => {
    render(
      <CardDescription data-testid="desc">Description</CardDescription>
    );

    expect(screen.getByTestId("desc")).toHaveTextContent("Description");
  });

  it("renders CardContent", () => {
    render(
      <CardContent data-testid="content">Content</CardContent>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders complete Card composition", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Main Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
