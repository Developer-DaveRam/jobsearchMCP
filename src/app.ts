import express from "express"
import swaggerUi from "swagger-ui-express"
import swaggerdoc from "./api/swagger-output.json" with { type: "json" }
import jobRouter from "./router/job.router.js";
import dotenv from 'dotenv'
import cors from "cors"

dotenv.config()
const app = express();
const port = process.env.PORT || 5066;

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static("src/public"))
app.use("/uploads", express.static("uploads"))

app.use("/jobs", jobRouter)

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerdoc))

app.listen(port, () => {
  console.log(`Server is on PORT http://localhost:${port}`)
})
