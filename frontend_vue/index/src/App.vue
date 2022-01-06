<template>
  <header>
	</header>
			<div id = "panel1" >
				<div id = "panel1Head">
					<div id = "infoHead" class = "InfoHead">
						<span id ="multLbl"  name = "multInfo" class = "InfoHead Label" :style="{'color': multLblColor}">
              {{multLbl}}
						</span>
						<span  id ="multCounter"  name = "multCounter" class = "InfoHead Counter" :style="{'color': multColor, 'font-size': multFontSize, 'left': multLeft, 'top': multTop, 'position': multPosition}">
                {{mult}}
						</span>	
					</div>	
				</div>
				<div id = "panel1Body" class="panel-body">
					<div id = "balanceInfo" class = "BalanceInfo">
						<span  id = "balanceLabel" name = "BalanceInfo" >
							BALANCE:
						</span>
							<span id ="balanceCounter" name = "balanceCounter" class = "BalanceInfo Counter">
                ${{balance}}
						</span>	
					</div>
					<div id="formBet">
						<input id="inputBet" name="formBet"  type="number" min = "0"  placeholder="BET VALUE" v-model = "bet" :disabled = "inputBetDisabled" :style="{'background-color': inputBetBackground, 'opacity': inputBetOpacity}">
					</div>
					<div id="buttonBet">
						<button id = "btnBet" name = "btnBet"  @click = "onBtnClick" :disabled = "btnBetDisabled"  :style="{'background-color': btnBetBackground, 'opacity': btnBetOpacity}"> 
              {{btnBet}}
						</button>
					</div>	
				</div>	
			</div>
</template>

<script>

export default {
  name: 'App',
  data(){
    return {
      multTop: "30px",
      multColor: "rgba(255, 255, 255, 0.4)",
      multFontSize: "32px",
      multLeft: "-25%",
      multPosition: "relative",
      multLblColor: "rgba(255, 255, 255, 0.4)",
      inputBetOpacity: "1.0",
      inputBetDisabled: false,
      btnBetBackground: "#292C33", 
      btnBetOpacity: "1.0",
      btnBetDisabled: false,
      connection: null,
      btnBet: '',
      multLbl: '',
      bet: 0,
      mult: 1,
      balance: 100,
    }
  }, 
  methods: {
    onBtnClick(){ 
        this.connection.send(JSON.stringify({action: 'BTN_BET_CLICKED', bet: this.bet}));
    }
  },
  mounted() {
    console.log("Starting connection to WebSocket Server")
    this.connection = new WebSocket("ws://localhost:8381")

    if(this.connection ){
      this.connection.onmessage = (message) => {
      try {
        const jsonMessage = JSON.parse(message.data);
        switch (jsonMessage.action) {
          case "SECOND_BEFORE_START":
            this.mult = jsonMessage.data;
            break;
          case "CNT_MULTIPLY":
            this.mult = jsonMessage.data;
            break;
          case "CNT_BALANCE":
            this.balance = (Math.trunc(jsonMessage.balance)== jsonMessage.balance ? Math.trunc(jsonMessage.balance) : parseFloat(jsonMessage.balance).toFixed(3));
            break;
          case "BETTED":
            this.btnBetOpacity = "0.4";
            this.btnBetDisabled = true;
            break;
          case "ROUND_PREPARING":
            this.bet = 0;
            this.inputBetOpacity = "1.0";
            this.inputBetDisabled = false;
            this.btnBet = "PLACE A BET";
            this.btnBetOpacity = "1.0";
            this.btnBetDisabled = false;

            this.multLbl = "BE READY FOR A ROUND:";
            this.multLblColor = "rgba(255, 255, 255, 0.4)";

            this.multColor = "rgba(255, 255, 255, 0.4)";
            this.multFontSize = "32px";
            this.multLeft = "-25%";
            this.multPosition = "relative";

            break;
          case "ROUND_STARTED":
            this.inputBetOpacity = "0.4"
            this.inputBetDisabled = true

            if(jsonMessage.isBetted){
              this.btnBetOpacity = "1.0"
              this.btnBetDisabled = false
            }else{
              this.btnBetOpacity = "0.4"
              this.btnBetDisabled = true
            }

            this.btnBet = "     TAKE";
            this.btnBetBackground = "#882424";


            this.multLbl = "";

            this.multLeft = "10%";
            this.multFontSize = "44px";
            this.multColor = "#C27500";

            break;
          case "ROUND_ENDS":

            this.multPosition = "absolute";
            this.multFontSize = "32px";
            this.multLeft = "0%";
            this.mult =  'x' 
                                    +  parseFloat(jsonMessage.totalMult).toFixed(3) 
                                    + " - Crashed!";

            this.btnBetBackground = "#292C33";
            this.btnBetDisabled = true;

            break;
          case "ROUND_ENDED":
            this.mult = "";
            break;

           case "WON":
            this.btnBetOpacity = "0.4";
            this.btnBetDisabled = true;
            this.multLeft = "-30%";
            this.multLblColor = "#00C208";
            this.multLbl= "YOU ARE WON: " 
                                    + (Math.trunc(jsonMessage.bet) == jsonMessage.bet ? Math.trunc(jsonMessage.bet) : parseFloat(jsonMessage.bet).toFixed(3))   
                                    + " x " 
                                    + parseFloat(jsonMessage.mult).toFixed(3);
            break;

          case "LOST":
            this.multPosition = "absolute";
            this.multLeft = "-180px";
            this.multTop = "50px";
            this.multLblColor = "#C20000";
            this.multLbl = "CRASHED ! YOU ARE LOST: " 
                                    + (Math.trunc(jsonMessage.bet) == jsonMessage.bet ? Math.trunc(jsonMessage.bet) : parseFloat(jsonMessage.bet).toFixed(3)) 
                                    + "$";
            break;
            
          default:
            console.log('Неизвестная команда');
            break;
        }
      } catch (error) {
        console.log('Ошибка', error);
      }

    }
    this.connection.onclose = function() {
      console.log("Connection lost !!!")
    }
      this.connection.onopen = function(event) {
      console.log(event)
      console.log("Successfully connected to the  websocket server...")
    }
  }
  else console.log("Failed connected to the  websocket server")
}
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}


body {
margin:auto;
position: relative;
width: 1440px;
height: 900px;

background: #16171B;

}


header {
	height:  100px;
	position:  relative;
	padding:  15px;
	font-family: 'Rubik Beastly', cursive;
	font-size: 40px;
	padding-left: 120px;
	text-align: right;
}


#panel1 {
position: absolute;
width: 449px;
height: 340px;
left: 460px;
top: 280px;

background: #34393D;
border: 3px solid #3D4249;
box-sizing: border-box;
box-shadow: inset 20px 30px 60px 1px #25282D;
border-radius: 20px;
}


#panel1Head {
	position: relative;
width: 443px;
height: 158px;
top: 10%;
left: 30%;



}

.InfoHead{
	font-family: Roboto;
	font-style: normal;
	font-weight: normal;
	font-size: 16px;
	line-height: 19px;
	display: flex;
	align-items: center;
	text-align: center;
	color: rgba(255, 255, 255, 0.4);
}

.InfoHead.Label {
	position: relative;
	font-size: 16px;
}
.InfoHead.Counter {
	position: relative;
	font-weight: bold;
	font-size: 32px;
	top:32px;
}

#panel1Body {
position: relative;
width: 443px;
height: 54px;
left: 0;
top: 0;
}


#balanceInfo{
	position: relative;
	left: 10%;
	top: 100%;

}
.BalanceInfo {
	font-family: Roboto;
font-style: normal;
font-weight: normal;
font-size: 16px;
line-height: 19px;
display: flex;
align-items: center;
text-align: center;

color: rgba(255, 255, 255, 0.4);
}

.BalanceInfo.Counter {
	position: relative;
	top: 30px;
	left: -25%;
	font-weight: bold;
	font-size: 32px;
}

#formBet{
	position: absolute;
	width: 132px;
	height: 54px;
	left: 35%;
	top: 100%;


}
#inputBet{
	width: 100%;
	height: 100%;
border-color: #292C33;
background: #282B30;
box-shadow: inset 4px 4px 6px rgba(0, 0, 0, 0.2), inset -4px -4px 6px rgba(255, 255, 255, 0.12);
border-radius: 15px;
text-align: center;
	color: rgba(255, 255, 255, 0.4);
	display: block;
	padding: 4px 5px;
	background-color: #292C33;

  }
  #inputBet::placeholder{
	opacity: 0.4;
	
  }

  #buttonBet {
	position: absolute;
	width: 93px;
	height: 93px;
	left: 75%;
	top: 67%;
	
  }

  #btnBet {
	width: 100%;
	height: 100%;
	text-align: center;
	border-radius: 100%;
	border-color: #292C33;
	background: #292C33;
	box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.3), -5px -5px 20px rgba(255, 255, 255, 0.12), inset -4px -4px 10px rgba(255, 255, 255, 0.12), inset 4px 4px 10px rgba(0, 0, 0, 0.25);
font-family: Roboto;
font-style: normal;
font-weight: bold;
font-size: 14px;
line-height: 16px;
display: flex;
align-items: center;
text-align: center;

color: rgba(255, 255, 255, 0.4);


  }
</style>
