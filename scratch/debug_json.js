const responseText = "```json\n[\n  {\"id\": 1}\n]\n```";
let cleanText = responseText.replace(/json/gi, '').replace(/```/gi, '').trim();
console.log("Input:", responseText);
console.log("Output:", cleanText);
try {
  JSON.parse(cleanText);
  console.log("Success!");
} catch (e) {
  console.log("Failure:", e.message);
}
