import app from "./src/app.js"
import connectDb from "./src/config/database.js"

connectDb();

app.listen(3000,()=>{
    console.log("server is runnig on 3000")
})