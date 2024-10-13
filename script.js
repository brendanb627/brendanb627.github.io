document.addEventListener("DOMContentLoaded", function() {
    var scene = document.getElementById('scene');
    var parallaxInstance = new Parallax(scene);
  
    scene.addEventListener('mouseover', function() {
        parallaxInstance.update({ hover: true });
      });
      
      scene.addEventListener('mouseout', function() {
        parallaxInstance.update({ hover: false });
      });
  });