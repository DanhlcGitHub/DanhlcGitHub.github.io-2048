var GameManager = {
    gamestate : "playing",// playing | win | loose
    score : 0,
    bestScore: 0,
    size : 4,
    data : null, // ma trận 4-4 để lưu dữ liệu; giá trị 0 nghĩa là ô trống 
    transformData : {},//lưu tọa độ nguồn(key) và tọa độ đích(value) của những tile có khả năng di chuyển khi bấm nút lên - xuống - qua - lại
    mergeMap : {},// lưu tọa độ của những điểm merge sau khi key event kết thúc
    dataKey : '2048-data-key',
    scoreKey : '2048-score-key',
    bestScoreKey : '2048-best-score-key',
    GameStart : function () {// hàm này đặt trong sự kiện window.onload
        if(localStorage.getItem(this.dataKey)){//try load from local storage
            this.LoadDataFromStorage();
            // show data on grid
            this.ShowGridData();
            // cap nhat diem so
            var best_score_container = document.getElementById("best-score-container");
            var score_container = document.getElementById("score-container");
            best_score_container.innerHTML = this.bestScore;
            score_container.innerHTML = this.score;
        }else{// If Not Load successfully Create New Game
            this.NewGame();
        }
    },
    NewGame : function(){
        // Load best score form stoage
        if(localStorage.getItem(this.bestScoreKey)){
            var dataString = localStorage.getItem(this.bestScoreKey);
            this.bestScore = JSON.parse(dataString);
        }
        // xoa gameMessage layer
        var gameMessage = document.getElementById("game-message");
        gameMessage.style.display = "none";
        // delete Localstoage
        this.RemoveDataFromStorage();
        // initial new data
        this.data = [
                      [0, 0, 0, 0],
                      [0, 0, 0, 0],
                      [0, 0, 0, 0],
                      [0, 0, 0, 0],
                    ],
        this.RandomTile();
        this.RandomTile();
        this.score = 0;
        this.ShowGridData();
        this.gamestate = "playing";
        // cap nhat diem so
        var best_score_container = document.getElementById("best-score-container");
        var score_container = document.getElementById("score-container");
        best_score_container.innerHTML = this.bestScore;
        score_container.innerHTML = this.score;
    },
    RandomTile : function(){// hàm random này chỉ add random vào data || animation do hàm ShowGridData() và TransitionEffect() đảm nhận
        if(!this.IsFull()){
            var i = Math.floor(Math.random()*1000%this.size);
            var j = Math.floor(Math.random()*1000%this.size);
            while(this.data[i][j]!=0){ // random tọa độ trống để đặt giá trị
                i = Math.floor(Math.random()*1000%this.size);
                j = Math.floor(Math.random()*1000%this.size);
            }
            var maxValue = this.GetMaxValue();
            if(maxValue<32){ // nếu giá trị lớn nhất chưa >= 32 thì chỉ random ra số 2
                this.data[i][j] = 2;
            }
            else{ // nếu giá trị lớn nhất trong this.data đã >32 thì random ra 2 hoặc 4 với tỉ lệ ra 2 là 80%
                var randomArray = [2,2,2,2,2,2,2,2,4,4];
                var index = Math.floor(Math.random()*1000% 10);
                this.data[i][j] = randomArray[index];
            }
            // add to merge Map
            var key = i+"-"+j;
            this.mergeMap[key] = 10000; 
        }
    },
    TransitionEffect : function(direction){// dựa vào transformData gắn các class cho các tile hiện thời
                                           // transformData 
                                           // kết hợp với hướng di chuyển tính toán được tile nào sẽ di chuyển về hướng nào bao nhiêu step
                                           // từ đó gắn các class phù hợp tạo hiệu ứng
        for (var key in this.transformData) { // key = startLocation; value = endLocation
            value = this.transformData[key];
            var start = key.split('-');
            var x_start = Number(start[0]) + 1;
            var y_start = Number(start[1]) + 1;
            var end = value.split('-');
            var x_end = Number(end[0]) + 1;
            var y_end = Number(end[1]) + 1;
            var step = 0;
            if(direction === "up" || direction === "down"){
                step = Math.abs(x_end - x_start);
            }else if(direction === "left" || direction === "right"){
                step = Math.abs(y_end - y_start);
            }
            var id = "position-" + x_start + "-" + y_start;
            var transformElement = document.getElementById(id);//.tile-move-up-2-step
            transformElement.className = "tile-cell tile-move-"+ direction +"-" + step + "-step";
        }
    },
    ShowGridData : function(){ // show dữ liệu hiện thời trong ma trận thông qua các class CSS
                                // mỗi ô trong ma trận data tương ứng với 1 tile(ngói) 
                                // kết hợp với transform data để biết rằng có ô nào di chuyển sau khi press key down hay không
                                // transformData.size == 0  nghĩa là k có ô nào di chuyển lúc đó -> không thực hiện random tile mới
                                // đông thời kết hợp với mergeMap mà biết được tile nào được merge để làm hiệu ứng thu phóng cho phù hợp
                                // lưu ý: hàm này xóa hết tất cả các tile hiện có. và viết lại cái mới
        // calculate merMap size
        var transformDataSize = 0;
        for (var key in this.transformData) {
           if (this.transformData.hasOwnProperty(key)) transformDataSize++;
        }
        // random Tile
        if(transformDataSize>0) // transformDataSize = 0 có nghĩa là không di chuyển dc
            this.RandomTile();
        // Display Data after Tile move finish
        var tile_container = document.getElementById("tile-container");
        tile_container.innerHTML = "";
        for(var i=0 ; i < this.size; i++)
        {
            var grid_row = document.createElement('div');
            grid_row.className = "grid-row";
            for(var j=0; j < this.size; j++)
            {
                var className = "";
                var textContent = "";
                var value = this.data[i][j];
                if(value!=0){
                    var key = i + "-" + j;
                   if(this.mergeMap[key] === undefined){
                        className = "tile-inner tile-inner-" + value;
                        textContent = value;
                    }else{// first load
                        className = "tile-inner-zoom tile-inner-" + value; // zoom help it's look like merge
                        textContent = value;
                    }
                }
                var tile_cell = this.ConvertToHmtl(className,textContent);
                tile_cell.id = "position-" + (i+1) +"-"+(j+1);
                grid_row.appendChild(tile_cell);
            }
            tile_container.appendChild(grid_row);
        }
        
        // Modify game state
        if(this.IsWin()) {
            this.gamestate = "win";
            // win affect
            var gameMessage = document.getElementById("game-message");
            var gameMessageText = document.getElementById("game-message-text");
            gameMessage.style.display = "block";
            gameMessageText.textContent = "You Win";
        }
        else if(this.IsLoose()) {
            this.gamestate = "loose";
            //loose affect
            var gameMessage = document.getElementById("game-message");
            var gameMessageText = document.getElementById("game-message-text");
            gameMessage.style.display = "block";
            gameMessageText.textContent = "Game Over";
        }
        else this.gamestate = "playing";
    },
    IncreaseScore : function(point){
        var best_score_container = document.getElementById("best-score-container");
        var score_container = document.getElementById("score-container");
        score_container.innerHTML = this.score + "<div class='score-addition'>+"+point+"</div>";
        if(this.bestScore<this.score) {
            best_score_container.innerHTML = this.score;
            //====== Save best score to Storage
            dataString = JSON.stringify(this.score);
            localStorage.setItem(this.bestScoreKey,dataString);
        }
    },
    ConvertToHmtl : function(className,textContent){
        var div = document.createElement('div');
        div.className = "tile-cell";
        var subdiv = document.createElement('div');
        subdiv.className = className;
        subdiv.textContent = textContent;
        div.appendChild(subdiv);
        return div;
    },
    GetMaxValue : function(){
        var max = 0;
        for(var i = 0 ; i< this.size ; i++){
            for(var j = 0 ; j<this.size; j++){
                if(this.data[i][j] > max) 
                    max = this.data[i][j];
            }
        }
        return max;
    },
    IsFull : function(){// check data is full fill or not
        for(var i = 0 ; i< this.size ; i++){
            for(var j = 0 ; j<this.size; j++){
                if(this.data[i][j]===0) return false;
            }
        }
        return true;
    },
    IsLoose : function(){// check loose
        if(this.IsFull()){ //full mới check
            for(var i = 0 ; i< this.size ; i++){
                for(var j = 0 ; j<this.size; j++){
                    var currentTile = this.data[i][j];
                    //tile kề dưới
                    if(i!==this.size -1){//
                        var currentDownTile = this.data[i+1][j];
                        if(currentTile === currentDownTile) return false;
                    }
                    //tile kề phải
                    if(j!==this.size -1){ 
                        var currentRightTile = this.data[i][j+1];
                        if(currentTile === currentRightTile) return false;
                    }
                }
            }
            return true;
        }else{
            return false;
        }
    },
    IsWin : function(){// check win
        for(var i = 0 ; i< this.size ; i++){
            for(var j = 0 ; j<this.size; j++){
                if(this.data[i][j]===2048) return true;
            }
        }
        return false;
    },
    /*=================== Important function ======================== */
    ManageKeyDownEvent : function(direction){
        if(this.gamestate === "playing"){
            // xóa mergeMap ; 
            // sau khi hàm này chạy xong thì mergeMap sẽ được điền đầy đủ với key là tọa độ của những ô bị merge
            this.mergeMap = {};
            // xóa transfomrData ; 
            // sau khi hàm này chạy xong thì transfomrData sẽ được điền đầy đủ với key là tọa độ ban đầu và value là tọa độ đích
            // của những tile có thể di chuyển
            this.transformData = {};
            switch (direction) {
              case 'right':
                for(var i = 0 ; i<this.size; i++){ // duyệt hàng
                    for(var j = this.size -2; j>=0 ; j--){ // xét từng cột từ phải qua; bắt đầu từ phần tử kề cuối(this.size -2)
                        var currentTile = this.data[i][j];
                        //nếu phần từ đang xét có giá trị thì
                        if(currentTile!==0){
                            // lấy phần tử liền kề bên phải nó ra để xét
                            var nextRightTile = 0;
                            var nextTileJ = j;
                            while(nextRightTile==0 && nextTileJ<this.size-1){ // nghĩa là nextRightTile!=0 hoặc nextTileJ<this.size thì dừng  
                                nextRightTile = this.data[i][++nextTileJ];
                            }
                            // kiểm tra xem nextRightTile có bằng 0 hay không
                            // nếu bằng 0 nghĩa là sau currentTile không có ô nào có giá trị cả
                            // chuyển currentTile đến vị trí phải cùng
                            if(nextRightTile === 0){
                                // thay đổi transformData
                                var key = i + "-" + j;
                                var value = i + "-" + (this.size-1) + ""; 
                                this.transformData[key] = value;
                                //console.log("key: " + key + " - value: " + value);
                                // thay đổi data
                                this.data[i][this.size-1] = currentTile;// change destination tile value
                                this.data[i][j] = 0; // change current tile value
                            }
                            else{// nếu có giá trị
                                // so sánh currentTile and nextRightTile
                                // và trước đó nextRightTile này chưa có trong danh sach được merge
                                if(currentTile === nextRightTile && this.mergeMap[i+"-"+nextTileJ]=== undefined){
                                    // nếu giống nhau MERGE
                                    // tức là di chuyển currentTile đến vị trí nextRightTile
                                    // thay đổi transformData
                                    var key = i + "-" + j;
                                    var value = i + "-" + (nextTileJ) + "";// *****
                                    this.transformData[key] = value;
                                    //console.log("key: " + key + " - value: " + value);
                                    // thay đổi data
                                    this.data[i][nextTileJ] = currentTile * 2;// change destination tile value
                                    this.data[i][j] = 0; // change current tile value
                                    // Add merge map - value la destination position
                                    this.mergeMap[value] = 10000;
                                    // IncreaseScore
                                    this.score += currentTile * 2;
                                    this.IncreaseScore(currentTile*2);
                                }
                                else{// nếu khác nhau hoặc ô dc so sánh là ô đã merge trước đó
                                    // nếu j và nextTileJ hơn nhau hơn 1 đơn vị 
                                    // thì currentTile chuyển đến vị trí kề trái gần nhất nextTileJ
                                    if(nextTileJ - j > 1){
                                        // thay đổi transformData
                                        var key = i + "-" + j;
                                        var value = i + "-" + (nextTileJ-1) + ""; // ****
                                        this.transformData[key] = value;
                                        //console.log("key: " + key + " - value: " + value);
                                        // thay đổi data
                                        this.data[i][nextTileJ-1] = currentTile;// change destination tile value
                                        this.data[i][j] = 0; // change current tile value
                                    }
                                }
                            }
                        }
                    }
                }
               // this.DisplayData();
                break;
              case 'up':
                for(var j = 0 ; j<this.size; j++){ // duyệt cột
                    for(var i = 1; i<this.size ; i++){ // xét từng hàng từ trên xuống; bắt đầu từ phần thứ hai
                        var currentTile = this.data[i][j];
                        //nếu phần từ đang xét có giá trị thì
                        if(currentTile!==0){
                            // lấy phần tử liền kề bên dưới nó ra để xét
                            var nextUpTile = 0;
                            var nextTileI = i;
                            while(nextUpTile==0 && nextTileI>0){ // nghĩa là nextUpTile!=0 hoặc nextTileI<0 thì dừng  
                                nextUpTile = this.data[--nextTileI][j];
                            }
                            // kiểm tra xem nextUpTile có bằng 0 hay không
                            // nếu bằng 0 nghĩa là trên currentTile không có ô nào có giá trị cả
                            // chuyển currentTile đến vị trí trên cùng
                            if(nextUpTile === 0){
                                // thay đổi transformData
                                var key = i + "-" + j;
                                var value =  "0-" + j + ""; 
                                this.transformData[key] = value;
                                //console.log("key: " + key + " - value: " + value);
                                // thay đổi data
                                this.data[0][j] = currentTile;// change destination tile value
                                this.data[i][j] = 0; // change current tile value
                            }
                            else{// nếu có giá trị
                                // so sánh currentTile and nextUpTile
                                // và trước đó nextUpTile này chưa có trong danh sach được merge
                                if(currentTile === nextUpTile  && this.mergeMap[nextTileI+"-"+j]=== undefined){
                                    // nếu giống nhau MERGE
                                    // tức là di chuyển currentTile đến vị trí nextUpTile
                                    // thay đổi transformData
                                    var key = i + "-" + j;
                                    var value = (nextTileI) + "-" + j + "";// *****
                                    this.transformData[key] = value;
                                    //console.log("key: " + key + " - value: " + value);
                                    // thay đổi data
                                    this.data[nextTileI][j] = currentTile * 2;// change destination tile value
                                    this.data[i][j] = 0; // change current tile value
                                    // Add merge map - value la destination position
                                    this.mergeMap[value] = 10000;
                                    // IncreaseScore
                                    this.score += currentTile * 2;
                                    this.IncreaseScore(currentTile*2);
                                }
                                else{// nếu khác nhau 
                                    // nếu i và nextTileI hơn nhau hơn 1 đơn vị 
                                    // thì currentTile chuyển đến vị trí trên liền kề với nextTileJ
                                    if(i - nextTileI > 1){
                                        // thay đổi transformData
                                        var key = i + "-" + j;
                                        var value = (nextTileI+1) + "-" + j + ""; // ****
                                        this.transformData[key] = value;
                                        //console.log("key: " + key + " - value: " + value);
                                        // thay đổi data
                                        this.data[nextTileI+1][j] = currentTile;// change destination tile value
                                        this.data[i][j] = 0; // change current tile value
                                    }
                                }
                            }
                        }
                    }
                }
               // this.DisplayData();
                break;
              case 'left':
                for(var i = 0 ; i<this.size; i++){ // duyệt hàng
                    for(var j = 1; j<this.size ; j++){ // xét từng cột từ trái qua; bắt đầu từ phần tử thứ 2
                        var currentTile = this.data[i][j];
                        //nếu phần từ đang xét có giá trị thì
                        if(currentTile!==0){
                            // lấy phần tử liền kề bên trái nó ra để xét
                            var nextLeftTile = 0;
                            var nextTileJ = j; // vị trí gần nhất mà nó có thể chuyển đến
                            while(nextLeftTile == 0 && nextTileJ>0){ // nghĩa là nextRightTile!=0 hoặc nextTileJ<0 thì dừng  
                                nextLeftTile = this.data[i][--nextTileJ];
                            }
                            // kiểm tra xem nextLeftTile có bằng 0 hay không
                            // nếu bằng 0 nghĩa là trước currentTile không có ô nào có giá trị cả
                            // chuyển currentTile đến vị trí trái cùng
                            if(nextLeftTile === 0){
                                // thay đổi transformData
                                var key = i + "-" + j;
                                var value = i + "-0" + ""; 
                                this.transformData[key] = value;
                                //console.log("key: " + key + " - value: " + value);
                                // thay đổi data
                                this.data[i][0] = currentTile;// change destination tile value
                                this.data[i][j] = 0; // change current tile value

                            }
                            else{// nếu có giá trị
                                // so sánh currentTile and nextLeftTile
                                // và trước đó nextLeftTile này chưa có trong danh sach được merge
                                if(currentTile === nextLeftTile && this.mergeMap[i+"-"+nextTileJ]=== undefined){
                                    // nếu giống nhau MERGE
                                    // tức là di chuyển currentTile đến vị trí nextLeftTile
                                    // thay đổi transformData
                                    var key = i + "-" + j;
                                    var value = i + "-" + (nextTileJ) + "";// *****
                                    this.transformData[key] = value;
                                    //console.log("key: " + key + " - value: " + value);
                                    // thay đổi data
                                    this.data[i][nextTileJ] = currentTile * 2;// change destination tile value
                                    this.data[i][j] = 0; // change current tile value
                                    // Add merge map - value la destination position
                                    this.mergeMap[value] = 10000;
                                    // IncreaseScore
                                    this.score += currentTile * 2;
                                    this.IncreaseScore(currentTile*2);
                                }
                                else{// nếu khác nhau 
                                    // nếu j và nextTileJ hơn nhau hơn 1 đơn vị 
                                    // thì currentTile chuyển đến vị trí kề trái gần nhất nextTileJ
                                    if(j - nextTileJ > 1){
                                        // thay đổi transformData
                                        var key = i + "-" + j;
                                        var value = i + "-" + (nextTileJ+1) + ""; // ****
                                        this.transformData[key] = value;
                                        //console.log("key: " + key + " - value: " + value);
                                        // thay đổi data
                                        this.data[i][nextTileJ+1] = currentTile;// change destination tile value
                                        this.data[i][j] = 0; // change current tile value
                                    }
                                }
                            }
                        }
                    }
                }
              //  this.DisplayData();
                break;
              case 'down':
                for(var j = 0 ; j<this.size; j++){ // duyệt cột
                    for(var i = this.size -2; i>=0 ; i--){ // xét từng hàng từ dưới lên; bắt đầu từ phần tử kề cuối(this.size -2)
                        var currentTile = this.data[i][j];
                        //nếu phần từ đang xét có giá trị thì
                        if(currentTile!==0){
                            // lấy phần tử liền kề bên dưới nó ra để xét
                            var nextDownTile = 0;
                            var nextTileI = i;
                            while(nextDownTile==0 && nextTileI<this.size-1){ // nghĩa là nextDownTile!=0 hoặc nextTileI<this.size thì dừng  
                                nextDownTile = this.data[++nextTileI][j];
                            }
                            // kiểm tra xem nextDownTile có bằng 0 hay không
                            // nếu bằng 0 nghĩa là dưỡi currentTile không có ô nào có giá trị cả
                            // chuyển currentTile đến vị trí dưới cùng
                            if(nextDownTile === 0){
                                // thay đổi transformData
                                var key = i + "-" + j;
                                var value = (this.size-1) + "-" + j + ""; 
                                this.transformData[key] = value;
                                //console.log("key: " + key + " - value: " + value);
                                // thay đổi data
                                this.data[this.size-1][j] = currentTile;// change destination tile value
                                this.data[i][j] = 0; // change current tile value
                            }
                            else{// nếu có giá trị
                                // so sánh currentTile and nextDownTile
                                // và trước đó nextDownTile này chưa có trong danh sach được merge
                                if(currentTile === nextDownTile && this.mergeMap[nextTileI+"-"+j]=== undefined){
                                    // nếu giống nhau MERGE
                                    // tức là di chuyển currentTile đến vị trí nextRightTile
                                    // thay đổi transformData
                                    var key = i + "-" + j;
                                    var value = (nextTileI) + "-" + j + "";// *****
                                    this.transformData[key] = value;
                                    //console.log("key: " + key + " - value: " + value);
                                    // thay đổi data
                                    this.data[nextTileI][j] = currentTile * 2;// change destination tile value
                                    this.data[i][j] = 0; // change current tile value
                                    // Add merge map - value la destination position
                                    this.mergeMap[value] = 10000;
                                    // IncreaseScore
                                    this.score += currentTile * 2;
                                    this.IncreaseScore(currentTile*2);
                                }
                                else{// nếu khác nhau 
                                    // nếu i và nextTileI hơn nhau hơn 1 đơn vị 
                                    // thì currentTile chuyển đến vị trí trên liền kề với nextTileJ
                                    if(nextTileI - i > 1){
                                        // thay đổi transformData
                                        var key = i + "-" + j;
                                        var value = (nextTileI-1) + "-" + j  + ""; // ****
                                        this.transformData[key] = value;
                                        //console.log("key: " + key + " - value: " + value);
                                        // thay đổi data
                                        this.data[nextTileI-1][j] = currentTile;// change destination tile value
                                        this.data[i][j] = 0; // change current tile value
                                    }
                                }
                            }
                        }
                    }
                }
                //this.DisplayData();
                break;
              default:
                console.log('Sorry, we are out of .');
            }
            // tạo hiệu ứng chuyển động
            this.TransitionEffect(direction);
            // vì hiệu ứng chuyển động tốn mất 100ms làm chậm
            // nên việc đè các tile đúng lên sau khi di chuyển sẽ bị delay 100ms
            setTimeout("GameManager.ShowGridData()",100);
            // store to localstorage
            this.SaveToLocalStorage();
        }
    },
    /*=================== Manage LocalStorage =========================*/
    SaveToLocalStorage: function(){
        //======save matrix data
        var dataString = JSON.stringify(this.data);
        localStorage.setItem(this.dataKey,dataString);
        //======save current score
        dataString = JSON.stringify(this.score);
        localStorage.setItem(this.scoreKey,dataString);
        
    },
    LoadDataFromStorage : function(){
        // read from local storage
        if(localStorage.getItem(this.dataKey)){
            var dataString = localStorage.getItem(this.dataKey);
            this.data = JSON.parse(dataString);
        }
        if(localStorage.getItem(this.scoreKey)){
            var dataString = localStorage.getItem(this.scoreKey);
            this.score = JSON.parse(dataString);
        }
        if(localStorage.getItem(this.bestScoreKey)){
            var dataString = localStorage.getItem(this.bestScoreKey);
            this.bestScore = JSON.parse(dataString);
        }
    },
    RemoveDataFromStorage : function(){
        if(localStorage.getItem(this.dataKey)){
            localStorage.removeItem(this.dataKey);
        }
        if(localStorage.getItem(this.scoreKey)){
            localStorage.removeItem(this.scoreKey);
        }
       // localStorage.removeItem(this.bestScoreKey);
    },
};

document.body.onkeydown = function(e) {
    
    switch(e.which) {
        case 37: GameManager.ManageKeyDownEvent('left')
        break;

        case 38: GameManager.ManageKeyDownEvent('up')
        break;

        case 39: GameManager.ManageKeyDownEvent('right')
        break;

        case 40: GameManager.ManageKeyDownEvent('down')
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
};



window.onload = function(){
    GameManager.GameStart();
   
    document.getElementById("restart").onclick = GameManager.NewGame.bind(GameManager);
    document.getElementById("retry").onclick = GameManager.NewGame.bind(GameManager);
}

