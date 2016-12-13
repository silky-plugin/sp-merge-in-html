/**
 * Desc: 合并页面的js，css引用
 */
'use strict';
const _cheerio = require('cheerio')
const _path = require('path')
const _mergeScript = require('./merge-script');
const _mergeStype = require('./merge-style');
//寻找真实路径
const getRealFilePath = (cli, href, setting)=>{
  let extname = _path.extname(href)
  let search = setting.search || [];
  
  let filePath = _path.join(cli.cwd, href);
  
  //如果原文件不存在，则搜索匹配项
  if(!_fs.existsSync(filePath)){
    filePath = false;
    for(let i = 0, length = search.length; i < length; i++){
      let tmpFilepath = _path.join(cli.cwd, href.replace(/(\.\w+)$/, `.${search[i]}`))
      if(_fs.existsSync(tmpFilepath)){
        filePath = tmpFilepath;
        break
      }
    }
  }
  return filePath;
}


//标签引用
const mergeTagImport = (cli, content, options, data)=>{
  let $ = _cheerio.load(content, {decodeEntities: false});
  
  // /path/to/xx.html =>  xx
  let htmlFileName = data.outputFilePath.split('/').pop().split('.').shift();
  
  //处理css
  let cssSetting = options.css || {};
  let jsSetting = options.js || {};
  
  //
  let cssHrefList = [];

  $("link[type='component/css']").each(function(){
    let href = $(this).attr('href');
    if(!href || /^(\s)*$/.test(href)){
      return;
    }
    let realFilePath = getRealFilePath(cli, href, cssSetting);
    if(!realFilePath){
      throw Error(`找不到 合并项文件${href}`)
    }

    //移除当前引用
    $(this).remove()

  });

  //添加全局引用到哪个选择器
  let cssAppendToSelector = cssSetting.appendTo || "head";
  //插入全局引用
  let cssHref = (cssSetting.out || `/css/$file.css`).replace('$file', htmlFileName)
  $(cssAppendToSelector).append(`<link href=${cssHref} type="text/css" rel="stylesheet"/>`)

  //插入js
  let jsAppendToSelector = jsSetting.appendTo || "body";
  let jsSrc = (jsSetting.out || `/js/$file.js`).replace('$file', htmlFileName);
  $(jsAppendToSelector).append(`<script src="${jsSrc}"></script>`);


  if(options.script){
    _mergeScript($)
  }
  if(options.style){
    _mergeStype($)
  }

  return $.html()


}

const replaceTag = (content)=>{
  let $ = _cheerio.load(content, {decodeEntities: false});
  $("link[type='component/css']").each(function(){
    $(this).attr('type', 'text/css')
  });
  $("script[type='component/js']]").each(function(){
    $(this).removeAttr('type')
  })
  return $.html()
}

exports.registerPlugin = (cli, options)=>{
  cli.registerHook('route:willResponse', (req, data, responseContent, cb)=>{
    let pathname = data.realPath;
    if(!/(\.html)$/.test(pathname)){
      return cb(null,  responseContent)
    }
    //没有经过 hbs 编译, 纯html,不处理
    if(data.status != 200 || !responseContent){
      return cb(null, responseContent)
    }

    cb(null, replaceTag(responseContent, data))

  }, 1)

  cli.registerHook('build:didCompile', (data, content, cb)=>{
    if(!/(\.html)$/.test(data.outputFilePath) || !content){
      return cb(null, data, content)
    }
    try{
      content = mergeTagImport(cli, content, options, data)
      cb(null, data, content)
    }catch(e){
      cb(e)
    }
  }, 1)
}