(function() {
    // global variables
    var canvas, ctx, w, h,
        player1X, player2X, playerY, radius, angle1, angle2,
        currIndex1, tempIndex1, currIndex2, tempIndex2, asteriodRadius,
        turn, team, moveStep, angleStep, dirX, dirY, score,
        backImg, channel_name, pubnub;

        channel_name = "MoonWarsGame21";  

    // init function
    function init() {
        canvas = document.getElementById("moonWarsCanvas");
        ctx = canvas.getContext('2d');
        w = canvas.width;
        h = canvas.height;

        player1X = w/4;
        player2X = 3 * (w / 4);
        playerY = h -27;
        radius = 25;
        angle1 = 0;
        angle2 = Math.PI;
        currIndex1 = { x:0, y:0 };
        currIndex2 = { x:0, y:0 };
        tempIndex1 = { x:-10, y:-10 };
        tempIndex2 = { x:-10, y:-10 };

        asteriodRadius = 2;
        dirX = 1;
        dirY = 1;

        turn = 0;
        team = "none";
        moveStep = 2;
        angleStep = Math.PI / 40;

        score = {P1: 0, P2: 0};

        window.onkeydown = keyEvent;

        addBackground();
    }

    function reinit() {
        dirX = 1;
        dirY = 1;
        tempIndex1 = { x:-10, y:-10 };
        tempIndex2 = { x:-10, y:-10 };
        return;
    }

    // add background
    backImg = new Image();

    backImg.onload = function() {
        ctx.drawImage(backImg, 0, 0, w, h);

        drawLayout();
        drawPlayer1(player1X, playerY, angle1);
        drawPlayer2(player2X, playerY, angle2);

        if(!turn && tempIndex1.x != -10 && tempIndex1.y != -10) {
            launchAsteroid(tempIndex1);
        } else if(turn && tempIndex2.x != -10 && tempIndex2.y != -10) {
            launchAsteroid(tempIndex2);
        }
    }

    function addBackground() {
        backImg.src = "back.jpeg";
    }

    // Update Scores
    function updateP1Score() {
        $('#Player1Score').text(Number($('#Player1Score').text()) + 1);
    }

    function updateP2Score() {
        $('#Player2Score').text(Number($('#Player2Score').text()) + 1);
    }

    // Draw Layout
    function drawLayout() {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w/2, h);
        ctx.lineTo(w/2, h - 100);
        ctx.stroke();
    }

    function drawPlayer1(x, y, angle) {
        currIndex1.x = x + 35 * Math.cos(angle);
        currIndex1.y = y - 35 * Math.sin(angle);
        ctx.strokeStyle = "#DA0000";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(currIndex1.x, currIndex1.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "#DA0000";
        ctx.fill();
    }

    function drawPlayer2(x, y, angle) {
        currIndex2.x = x + 35 * Math.cos(angle);
        currIndex2.y = y - 35 * Math.sin(angle);
        ctx.strokeStyle = "#004CB3";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(currIndex2.x, currIndex2.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "#004CB3";
        ctx.fill();
    }

    //Detecting Collision
    function detectCollision(x1, y1, r1, x2, y2, r2) {
        var dist2 = ((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
        if(dist2 < (r1+r2)*(r1+r2)) {
            return true;
        }
        return false;
    }

    // Launch Asteroid function
    function launchAsteroid(index) {
        // Collision Detection with players
        if(detectCollision(index.x, index.y, asteriodRadius, player1X, playerY, radius)) {
            score.P2 += 1;
            updateP2Score();
            turn = 1 - turn;
            reinit();
            return;
        }
        if(detectCollision(index.x, index.y, asteriodRadius, player2X, playerY, radius)) {
            score.P1 += 1;
            updateP1Score();
            turn = 1 - turn;
            reinit();
            return;
        }
        // Collision Detection with boundary
        if(index.x >= (w/2) - 2 && index.x <= (w/2) + 2 && index.y <= h && index.y >= h - 100) {
            dirX = -dirX;
        } else if(index.x < 0) {
            dirX = -dirX;
        } else if(index.x > w) {
            dirX = -dirX;
        } else if(index.y < 0) {
            dirY = -dirY;
        } else if(index.y > h) {
            turn = 1 - turn;
            reinit();
            return;
        }

        if(!turn) {
            tempIndex1.x = index.x + dirX*2*Math.cos(angle1);
            tempIndex1.y = index.y - dirY*2*Math.sin(angle1);
        } else {
            tempIndex2.x = index.x + dirX*2*Math.cos(angle2);
            tempIndex2.y = index.y - dirY*2*Math.sin(angle2);
        }

        ctx.beginPath();
        if(!turn) {
            ctx.arc(tempIndex1.x, tempIndex1.y, asteriodRadius, 0, 2*Math.PI, false);
        } else {
            ctx.arc(tempIndex2.x, tempIndex2.y, asteriodRadius, 0, 2*Math.PI, false);
        }
        ctx.fillStyle = "yellow";
        ctx.fill();
        setTimeout(function() {
            addBackground();
        }, 3);
    }

    // Pubnub Stuff
    pubnub = new PubNub({
        publishKey: "pub-c-8ad403cb-4734-4179-89bd-35c7ffb30e34",
        subscribeKey: "sub-c-7ad63f92-9ca1-11e8-b7e1-625ee96eadaa",
    });

    pubnub.subscribe({
        channels: [channel_name]
    });

    pubnub.addListener({
        message: function(message) {
            console.log(message);
            var message = message.message;
            turn = message.turn;
            score = message.score;
            if(turn) {
                player2X = message.centerX;
                angle2 = message.angle;
                currIndex2 = message.currIndex;
            } else {
                player1X = message.centerX;
                angle1 = message.angle;
                currIndex1 = message.currIndex;
            }
            launchAsteroid(message.currIndex);
        }
    });

    pubnub.hereNow({
        channels: [channel_name],
        includeUUIDs: false
    }, function(status, response){
        if(response.totalOccupancy == 0) {
            team = "red";
        } else if(response.totalOccupancy == 1) {
            team = "blue";
        } else {
            team = "none";
        }
    });

    // Take keyboard input
    function keyEvent(e) {
        e.stopImmediatePropagation();
        if((!turn && team=="blue") || (turn && team=="red") || (team=="none")) {
			return;
		}
        var keyCode = e.which;
        
        if(keyCode == 37) {
            if(!turn) {
                if(player1X - 40 > 0) {
                    player1X = player1X - moveStep;
                }
            } else {
                if(player2X - 40 > (w/2) + 2) {
                    player2X = player2X - moveStep;
                }
            }
            addBackground();
        } else if(keyCode == 39) {
            if(!turn) {
                if(player1X + 40 < (w/2) - 2) {
                    player1X = player1X + moveStep;
                }
            } else {
                if(player2X + 40 < w) {
                    player2X = player2X + moveStep;
                }
            }
            addBackground();
        } else if(keyCode == 38) {
            if(!turn) {
                if(angle1 + angleStep < Math.PI) {
                    angle1 = angle1 + angleStep;
                }
            } else {
                if(angle2 + angleStep < Math.PI) {
                    angle2 = angle2 + angleStep;
                }
            }
            addBackground();
        } else if(keyCode == 40) {
            if(!turn) {
                if(angle1 - angleStep >= 0) {
                    angle1 = angle1 - angleStep;
                }
            } else {
                if(angle2 - angleStep >= 0) {
                    angle2 = angle2 - angleStep;
                }
            }
            addBackground();
        } else if(keyCode == 32) {
            // launchAsteroid(currIndex1);
            pubnub.publish({
                channel: channel_name,
                message: {
                    turn: turn,
                    centerX: turn ? player2X : player1X,
                    angle: turn ? angle2 : angle1,
                    currIndex: turn ? currIndex2 : currIndex1,
                    score: score
                }
            });
        }
    }

    // call the init function
    init();
}());