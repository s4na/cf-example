import { expect, test } from "@playwright/test";

test("記事へ画像を追加して公開できる", async ({ page }) => {
  const slug = `e2e-${Date.now()}`;
  await page.goto("/admin");

  await page.getByLabel("タイトル").fill("E2E記事");
  await page.getByLabel("slug").fill(slug);
  await page.getByLabel("Markdown").fill("# E2E本文");
  await page.getByLabel("画像を追加").setInputFiles({
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
    mimeType: "image/png",
    name: "sample.png",
  });

  await expect(page.getByRole("status")).toContainText("画像を挿入しました");
  await expect(page.getByLabel("Markdown")).toHaveValue(
    /!\[sample\]\(\/media\//,
  );

  await page.getByRole("button", { name: "下書きを保存" }).click();
  await expect(page.getByRole("status")).toContainText("保存しました");
  await page.getByRole("button", { name: "公開する" }).click();
  await expect(page.getByRole("status")).toContainText("公開しました");

  await page.goto(`/articles/${slug}`);
  await expect(page.getByRole("heading", { name: "E2E記事" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E本文" })).toBeVisible();
  const image = page.getByRole("img", { name: "sample" });
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty("naturalWidth", 1);
});
