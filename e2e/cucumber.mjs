export default {
  paths: ["e2e/features/**/*.feature"],
  import: ["e2e/step-definitions/**/*.ts", "e2e/support/**/*.ts"],
  format: ["pretty", "html:reports/e2e.html"],
  tags: "not @manual and not @pending",
  strict: true,
};
