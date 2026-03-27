import axios from "axios";

async function run() {
  try {
    const res = await axios.post("http://localhost:4000/api/execute/intent", { text: "stake 1 init" });
    const id = res.data.data.id;
    console.log("Intent created:", id);
    
    console.log("Starting execution...");
    const execRes = await axios.post("http://localhost:4000/api/execute/confirm", {
      strategyId: id,
      sessionKey: "test-session-key",
      signature: "0xtest"
    });
    console.log("Execution success:", execRes.data);
  } catch (err: any) {
    console.error("Exec failed:", err.message);
    if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  }
}
run();
