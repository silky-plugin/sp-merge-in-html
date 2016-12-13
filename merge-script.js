module.exports = ($)=>{
  // merge script tag
  let scriptContent = [];
  $('script').each(function() {
    if($(this).attr('src')){return}
    let type = $(this).attr('type');
    if(type && type !== 'javascript'){return}
    scriptContent.push($(this).text())
    $(this).remove()
  });
  $(body).append(`<script>${scriptContent.join(';\n')}</script>`)
}