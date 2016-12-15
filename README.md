## 说明

合并 html 引用到的组件化 css，js。

## 使用

```js
"sp-merge-in-html":{
  "css": {
    "selector": ["link[component]"]
    "search":["less"],
    "out": "css/file.css",
    "appendTo": "head",
    
  },
  "js": {
    "selector": ["script[component]"]
    "search":[],
    "out": "js/$file.js",
    "appendTo": "head",
   
  },
  "script": false //or true,
  "stype":  false // or true
}
```

### options css

css 用来配置 link 组件。如有`index.html`如下：

```html
<html>
  <head>
    ...
    <link rel="stylesheet" href="/css/A.css" type="text/css"> 
    <link rel="stylesheet" href="/css/component-A.css" type="text/css" component> 
  </head>
  <body>
  ...
    <link rel="stylesheet" href="/css/component-B.css" type="text/css" component> 
  </body>
<html>
```

#### css.selector  可选  默认值：["link[component]"]

 Array<string> , 元素选择器，用来告诉插件哪些是你的自定义组件。 默认值：`["link[component]"]`.

 插件会在页面里面找到所有的 `$(css.selector)` 把它们标记为组件。等待下一步处理。

#### css.search 可选，默认值：[]

  插件提取 `$(css.selector)` 的`href`的值，在项目目录下进行搜索匹配。
  默认搜索`href`本身表示的文件链接,如`/css/component-A.css`。
    如果找到, 那么就会把文件内容，写入到配置`css.out`的文件中。
    如果没有找到，那么会依次用`css.search`的元素 替换 该`href`的`.css`后缀，直到找到为止。
    如果搜索完 全部后缀依然没有找到，那么抛出异常。

#### css.out 可选， 默认："/css/$file.css"

  输出文件路径。 其中 `$file` 为变量， 会把 该`link`所在的`html`名字替换它。


### css.appendTo  可选 默认 "head"

  合并后到文件添加到那个标签末尾。


如上述例子所示，那么结果为：

```html
<html>
  <head>
    ...
    <link rel="stylesheet" href="/css/A.css" type="text/css"> 
    <link rel="stylesheet" href="/css/index.css" type="text/css"> 
  </head>
  <body>
  ...
  </body>
<html>
```

### options js

配置同 css

### options script

 合并 script标签内的文本 插入到body后


### options style

  合并 style 标签内的文笔，插入到head后





