// Importações
import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import ImageModel from "../model/schema.js";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
const routes = express.Router();
routes.use("/uploads", express.static("uploads"));
routes.use(express.json());
dotenv.config();
// Api do gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Rotas
routes.post("/upload", async function (req, res) {
    const { image, customer_code, measure_datetime, measure_type } = req.body;
    try {
        const formattedDateMeasureDateTime = formattedDate(measure_datetime);
        const formattedMeasure_type = measure_type.toUpperCase();
        const existingImage = await ImageModel.findOne({
            measure_type: formattedMeasure_type,
            measure_datetime: formattedDateMeasureDateTime,
        });
        console.log(formattedMeasure_type);
        if (image === "" ||
            customer_code === "" ||
            formattedMeasure_type === "" ||
            (formattedMeasure_type !== "WATER" && formattedMeasure_type !== "GAS")) {
            return res.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados são inválidos",
            });
        }
        if (existingImage) {
            return res.status(409).json({
                error_code: "DOUBLE_REPORT",
                error_description: "Leitura do mês já realizada",
            });
        }
        const measureUUID = uuidv4();
        const responseGemini = await sendImageGemini(image);
        const measurementRecord = new ImageModel({
            customer_code: customer_code.toUpperCase(),
            measure_datetime: formattedDateMeasureDateTime,
            measure_type: formattedMeasure_type,
            measure_value: responseGemini,
            measure_uuid: measureUUID,
        });
        await measurementRecord.save();
        res.json({
            image_url: image,
            measure_value: responseGemini,
            measure_uuid: measureUUID,
        });
    }
    catch (error) {
        console.log("Error uploading file:", error);
        res.status(500).send({ message: "Error uploading file." });
    }
});
const formattedDate = (result) => {
    return moment(result).utc().format("YYYY-MM");
};
async function sendImageGemini(path) {
    const base64Pattern = /^([A-Za-z0-9+/=]+\s*)+$/;
    base64Pattern.test(path) && path.length % 4 === 0;
    const base64 = base64Pattern ? await convertUrlToBase64(path) : path;
    const prompt = `Por favor, identifique e forneça o valor da medida do medidor de gás ou de água que está na imagem 
  fornecida. Não precisa explicar`;
    try {
        const image = {
            inlineData: {
                data: base64,
                mimeType: "image/png",
            },
        };
        const result = await model.generateContent([prompt, image]);
        const response = result.response.text();
        return response;
    }
    catch (error) {
        console.log("Error sending image to Gemini:", error);
        throw error;
    }
}
async function convertUrlToBase64(url) {
    try {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");
        return buffer.toString("base64");
    }
    catch (error) {
        console.error("Error converting URL to Base64:", error);
        throw error;
    }
}
routes.patch("/confirm", async (req, res) => {
    const { measure_uuid, confirmed_value } = req.body;
    if (typeof measure_uuid !== "string" || typeof confirmed_value !== "string") {
        return res.status(400).json({
            error_code: "INVALID_DATA_TYPE",
            error_description: "Tipos de dados inválidos para measure_uuid ou confirmed_value.",
        });
    }
    // prettier-ignore
    const recuperarDados = await ImageModel.findOne({ measure_uuid: measure_uuid, });
    if (!recuperarDados) {
        return res.status(404).json({
            error_code: "MEASURE_NOT_FOUND",
            error_description: "Leitura do mês já realizada.",
        });
    }
    if (recuperarDados.measure_value === confirmed_value) {
        return res.status(409).json({
            error_code: "CONFIRMATION_DUPLICATE",
            error_description: "Duplicação de dados",
        });
    }
    recuperarDados.measure_value = confirmed_value;
    await recuperarDados.save();
    res.json({
        success: true,
    });
});
routes.get("/:customerCode/list", async (req, res) => {
    const { customerCode } = req.params;
    const measureTypeQuery = req.query.measure_type;
    try {
        // prettier-ignore
        const measure_type = typeof measureTypeQuery === "string" ? measureTypeQuery.toUpperCase() : "";
        // prettier-ignore
        var query = { customer_code: customerCode.toUpperCase() };
        if (measure_type === "WATER" || measure_type === "GAS") {
            // Tipo de medição é válido
            query.measure_type = measure_type;
        }
        else if (measure_type !== "") {
            // Tipo de medição não é válido e não é uma string vazia
            res.status(400).json({
                error_code: "INVALID_TYPE",
                error_description: "Tipo de medição não permitido",
            });
        }
        const recuperarDados = await ImageModel.find(query);
        const result = recuperarDados.map((item) => ({
            customer_code: item.customer_code,
            measure_datetime: item.measure_datetime,
            measure_type: item.measure_type,
            measure_value: item.measure_value,
        }));
        if (result.length > 0)
            res.json(result);
        else {
            res.status(404).json({
                error_code: "MEASURES_NOT_FOUND",
                error_description: "Nenhuma leitura encontrada",
            });
        }
    }
    catch (error) {
        console.error("Erro ao recuperar dados:", error);
        res.status(500).json({ message: "Erro ao recuperar dados." });
    }
});
export default routes;
//# sourceMappingURL=router.js.map
