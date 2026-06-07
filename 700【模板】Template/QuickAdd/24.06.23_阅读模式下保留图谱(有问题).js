Node.prototype.detach = function() {
  if (this.classList && this.classList.contains('mod-header')) {
      // console.log('Skipping detach for mod-header:', this);
      return;
  }
  this.parentNode && this.parentNode.removeChild(this);
  // console.log('Node detached:', this);
};

Node.prototype.setChildrenInPlace = function(t) {
  for (var e = this.firstChild, n = new Set(t), r = 0, o = t; r < o.length; r++) {
      for (var i = o[r]; e && !n.has(e); ) {
          var s = e;
          e = e.nextSibling;
          // console.log('Node classList:', s.classList);
          if (s.nodeType === 1 && s.classList.contains('mod-header')) {
              // console.log('Skipping node with mod-header:', s);
          } else {
              // console.log('Removing node:', s);
              this.removeChild(s);
          }
      }
      i !== e ? this.insertBefore(i, e) : e = e.nextSibling;
  }
  for (; e; ) {
      s = e;
      e = e.nextSibling;
      // console.log('Node classList:', s.classList);
      if (s.nodeType === 1 && s.classList.contains('mod-header')) {
          // console.log('Skipping node with mod-header:', s);
      } else {
          // console.log('Removing node:', s);
          this.removeChild(s);
      }
  }
};