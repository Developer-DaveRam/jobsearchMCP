export type ResponseFromate = {
    status:number;
    message:string;
    data:any[]
}

export class ResponseBuilder{
    private status:number;
    private message:string;
    private data:any[]

    constructor(status:number,message:string,data:any[] = []) {
        this.status = status;
        this.message = message;
        this.data = data
    }

    build():ResponseFromate{
        return {
            status:this.status,
            message:this.message,
            data:this.data
        }
    }

    static success(status:number = 1,message:string = "Success",data:any[]= []):ResponseFromate{
        return new ResponseBuilder(status,message,data).build()
    }
    static failure(status:number = 0, message:string = "Error",data:any[]=[]):ResponseFromate{
        return new ResponseBuilder(status,message,data).build()
    }
}
