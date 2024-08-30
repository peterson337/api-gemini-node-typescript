import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  customer_code: String,
  measure_datetime: String,
  measure_type: String,
  measure_value: String,
  measure_uuid: String,
});

const ImageModel = mongoose.model("images", imageSchema);

export default ImageModel;
