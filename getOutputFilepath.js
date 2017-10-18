const _path = require('path')
module.exports = (href, filename, filepath)=>{
    href = href.replace("$file", filename)
    let singleMatchArr = href.match(/\$path\[(\-?\d+)\]/)
    let doubleMatchArr = href.match(/\$path\[(\-?\d+)\,(-?\d+)\]/)
    filepath = filepath.replace(_path.parse(filepath).ext, "")
    if(!singleMatchArr && !doubleMatchArr){
        return href.replace("$path", filepath)
    }
    let pathArr = filepath.split(_path.sep)
    if(singleMatchArr){
        let replaceStr = singleMatchArr[0]
        let index = ~~singleMatchArr[1]
        let targetArr = pathArr.slice(index)
        return href.replace(replaceStr, targetArr.join("/"))
    }else {
        let replaceStr = doubleMatchArr[0]
        let start = ~~doubleMatchArr[1]
        let stop = ~~doubleMatchArr[2]
        let targetArr = pathArr.slice(start, stop)
        if(!targetArr.length){
            throw new Error(`无法按规则 ${replaceStr} 切割 ${filepath}`)
        }
        return href.replace(replaceStr, targetArr.join("/"))
    }
}