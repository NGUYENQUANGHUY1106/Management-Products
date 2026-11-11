import { app } from "./app.js";
app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
  console.log(
    "UserHub Admin API: http://localhost:" + (process.env.PORT || 3001),
  ),
);
