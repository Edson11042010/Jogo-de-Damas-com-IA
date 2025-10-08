document.addEventListener("DOMContentLoaded", function(){

  const SIZE = 8;
  let board = [];
  let selected = null;
  let currentPlayer = "red";
  let pontos = { red:0, black:0 };
  let modo = "1vs1";

  const boardEl = document.getElementById("board");
  const placarEl = document.getElementById("placar");
  const turnoEl = document.getElementById("turno");
  const menuEl = document.getElementById("menu");
  const btnReiniciar = document.getElementById("btnReiniciar");

  // MENU
  document.getElementById("btn1vs1").addEventListener("click", ()=>startGame('1vs1'));
  document.getElementById("btnIA").addEventListener("click", ()=>startGame('IA'));
  btnReiniciar.addEventListener("click", reiniciar);

  function startGame(selectedMode){
    modo = selectedMode;
    menuEl.style.display = "none";
    placarEl.style.display = "block";
    turnoEl.style.display = "block";
    boardEl.style.display = "grid";
    btnReiniciar.style.display = "inline-block";
    createBoard();
  }

  function createBoard(){
    boardEl.innerHTML = "";
    board = [];
    pontos = { red:0, black:0 };
    selected = null;
    currentPlayer = "red";
    updatePlacar();

    for(let r=0; r<SIZE; r++){
      let row = [];
      for(let c=0; c<SIZE; c++){
        const cell = document.createElement("div");
        cell.className = "cell " + ((r+c)%2===0?"light":"dark");
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener("click", ()=>handleClick(r,c));
        cell.addEventListener("touchstart", ()=>handleClick(r,c));

        if((r+c)%2===1){
          if(r<3){ cell.appendChild(createPiece("black")); row.push("black"); }
          else if(r>4){ cell.appendChild(createPiece("red")); row.push("red"); }
          else row.push(null);
        } else row.push(null);

        boardEl.appendChild(cell);
      }
      board.push(row);
    }
  }

  function createPiece(color){
    const piece = document.createElement("div");
    piece.className = "piece " + color;
    if(color.includes("king")) piece.classList.add("king");
    return piece;
  }

  function handleClick(r,c){
    if(modo==="IA" && currentPlayer==="black") return;
    const cellValue = board[r][c];
    if(cellValue && cellValue.startsWith(currentPlayer)){
      clearSelection();
      selected = {r,c};
      getCell(r,c).classList.add("selected");
    } else if(!cellValue && selected){
      movePiece(selected.r, selected.c, r,c);
    }
  }

  function movePiece(r1,c1,r2,c2){
    let piece = board[r1][c1];
    if(!isValidMove(r1,c1,r2,c2,piece)) return;

    // captura
    if(Math.abs(r2-r1)===2){ 
      const midRow = (r1+r2)/2;
      const midCol = (c1+c2)/2;
      board[midRow][midCol] = null;
      pontos[currentPlayer]++;
      updatePlacar();
    }

    board[r1][c1] = null;
    board[r2][c2] = piece;

    // dama
    if(piece==="red" && r2===0) board[r2][c2]="red-king";
    if(piece==="black" && r2===SIZE-1) board[r2][c2]="black-king";

    redrawBoard();

    if(Math.abs(r2-r1)===2){
      selected = {r:r2, c:c2};
      getCell(r2,c2).classList.add("selected");
      if(temCaptura(r2,c2,board[r2][c2])) return;
    }

    selected = null;
    currentPlayer = currentPlayer==="red"?"black":"red";
    updatePlacar();
    checkGameOver();

    if(modo==="IA" && currentPlayer==="black"){
      setTimeout(jogadaIA, 500);
    }
  }

  function isValidMove(r1,c1,r2,c2,piece){
    if(board[r2][c2]) return false;
    const isKing = piece.includes("king");
    const dir = piece.startsWith("red")?-1:1;

    if(!isKing){
      if(Math.abs(c1-c2)===1 && r2-r1===dir) return true;
      if(Math.abs(c1-c2)===2 && r2-r1===dir*2){
        const midRow=(r1+r2)/2, midCol=(c1+c2)/2;
        if(board[midRow][midCol] && !board[midRow][midCol].startsWith(piece.split("-")[0])) return true;
      }
      return false;
    }

    if(isKing){
      if(Math.abs(r2-r1)===Math.abs(c2-c1)){
        let stepR=r2>r1?1:-1, stepC=c2>c1?1:-1;
        let r=r1+stepR, c=c1+stepC, enemyFound=false;
        while(r!==r2 && c!==c2){
          if(board[r][c]){
            if(board[r][c].startsWith(piece.split("-")[0])) return false;
            if(enemyFound) return false;
            enemyFound=true;
          }
          r+=stepR; c+=stepC;
        }
        return true;
      }
    }
    return false;
  }

  function temCaptura(r,c,piece){
    const isKing = piece.includes("king");
    const dirs = isKing ? [[1,1],[1,-1],[-1,1],[-1,-1]] : piece.startsWith("red")?[[-1,1],[-1,-1]]:[[1,1],[1,-1]];
    for(const [dr,dc] of dirs){
      const midR=r+dr, midC=c+dc, endR=r+2*dr, endC=c+2*dc;
      if(endR>=0 && endR<SIZE && endC>=0 && endC<SIZE){
        if(board[midR][midC] && !board[midR][midC].startsWith(piece.split("-")[0]) && !board[endR][endC]) return true;
      }
    }
    return false;
  }

  function getCell(r,c){ return boardEl.children[r*SIZE+c]; }

  function redrawBoard(){
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const cell=getCell(r,c);
        cell.innerHTML="";
        cell.classList.remove("selected");
        if(board[r][c]) cell.appendChild(createPiece(board[r][c]));
      }
    }
  }

  function clearSelection(){
    for(let i=0;i<boardEl.children.length;i++) boardEl.children[i].classList.remove("selected");
  }

  function updatePlacar(){
    document.getElementById("pontosRed").innerText = pontos.red;
    document.getElementById("pontosBlack").innerText = pontos.black;
    turnoEl.innerText = currentPlayer==="red"?"Vez de: Vermelho":"Vez de: Preto";
  }

  function checkGameOver(){
    let redExists = board.flat().some(p => p && p.startsWith("red"));
    let blackExists = board.flat().some(p => p && p.startsWith("black"));
    if(!redExists) alert("Preto venceu!");
    if(!blackExists) alert("Vermelho venceu!");
  }

  function reiniciar(){ createBoard(); }

  // IA simples: escolhe peça aleatória e move aleatoriamente válida
  function jogadaIA(){
    let moves = [];
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const piece=board[r][c];
        if(piece && piece.startsWith("black")){
          for(let dr=-2;dr<=2;dr++){
            for(let dc=-2;dc<=2;dc++){
              let nr=r+dr, nc=c+dc;
              if(nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && isValidMove(r,c,nr,nc,piece)){
                moves.push({from:{r,c}, to:{r:nr,c:nc}});
              }
            }
          }
        }
      }
    }
    if(moves.length>0){
      const escolha = moves[Math.floor(Math.random()*moves.length)];
      movePiece(escolha.from.r,escolha.from.c,escolha.to.r,escolha.to.c);
    }
  }

});
