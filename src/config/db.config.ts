import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma";

const adapter = new PrismaMariaDb({
    host:"localhost",
    port:3306,
    user:"root",
    password:"",
    database:"jobsearchmcp"
})

export const db =     new PrismaClient({adapter})


 
 
async function checkconnect() {
    try {
   await db.$connect();
   console.log("DB connected");
} catch(err){
   console.log(err);
}
 
}
 
checkconnect()
 