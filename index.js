
var wikiHolder = document.getElementById("wikiHolder")
var guessLogBody = document.getElementById("guessLogBody");
var statLogBody = document.getElementById("statsTable");
var baffled = [];
var clicked= true;
var guessedWords = [];
var ans = [];
var ansStr;
var guessCounter = 0;
var hidingZero = false;
var hidingLog = false;
var currentlyHighlighted;
var gameWins = [];
var gameScores = [];
var gameAccuracy = [];
var gameAnswers = [];
var gameDates = [];
var hitCounter = 0;
var currentAccuracy = -1;
var save = {};
var pageRevealed = false;
var clickThruIndex = 0;
var clickThruNodes = [];
var redirectable;
var conting;
var playerID;
var rIndex;
var article;
function uuidv4(){
    return ([1e7]+1e3+4e3+8e3+1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
function getArticle(){
    return window.atob(article);
}
function median(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

const average = (array) => array.reduce((a, b) => a + b) / array.length;

function LoadSave(){

    if(localStorage.getItem("rSavet") === null){
        localStorage.clear();
        playerID = uuidv4();
        rIndex = 0;
        article = "";
        save = JSON.parse(JSON.stringify({"saveData":{article,rIndex,guessedWords,gameWins,gameScores,gameAccuracy,gameAnswers,gameDates},"prefs":{hidingZero,hidingLog,pluralizing},"id":{playerID}}));
    } else{
        save = JSON.parse(localStorage.getItem("rSavet"));
    }
    localStorage.setItem("rSavet",JSON.stringify(save));
    playerID = save.id.playerID;
    rIndex = save.saveData.rIndex;

    hidingZero = save.prefs.hidingZero;
    hidingLog = save.prefs.hidingLog;
    pluralizing = save.prefs.pluralizing;
    gameWins = save.saveData.gameWins;
    gameScores = save.saveData.gameScores;
    gameAccuracy = save.saveData.gameAccuracy;
    gameAnswers = save.saveData.gameAnswers;
    gameDates = save.saveData.gameDates;
    var gameDelta = rIndex - save.saveData.gameWins.length;
    
    for (var i = 0; i < gameDelta; i++){
        gameWins.push(0);
        gameScores.push(0);
        gameAccuracy.push(0);
        gameAnswers.push('');
    }

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.get('article') != null){
        article = urlParams.get('article');
    }

    if (article && (article != save.saveData.article)){
        save.saveData.article = article;
        save.saveData.rIndex = rIndex;
        save.saveData.guessedWords = [];
        guessedWords = [];
        guessCounter = 0;
        $("#tableHolder tbody tr").remove();
        document.getElementById("winText").style.display = 'none';
        baffled = [];
        document.getElementById("userGuess").disabled = false;
        document.getElementById("userGuess").focus();
        pageRevealed = false;
    }else{
        guessedWords = save.saveData.guessedWords;
        console.log(save.saveData.article);
    }
    
    SaveProgress();

    if (article){
        fetchData(false,article);
    }else if (save.saveData.article){
        fetchData(false,save.saveData.article);
    }
}

async function getRandomArticle(){

    let response = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=random&format=json&rnnamespace=0&rnlimit=1&origin=*');
    let data = await response.json();
    let title = await data.query.random[0].title;
    try {
        var encTitle = window.btoa(title);
    }
    catch (err) {
        console.log(err);
        return getRandomArticle();
    }
    article=encTitle;
    console.log(article);
    return encTitle;
}

async function fetchData(retry, artStr) {
    
    if(retry){
        var article = artStr;
        
    } else{
        var article = atob(artStr);
    }
    return await fetch('https://en.wikipedia.org/w/api.php?action=parse&format=json&page=' + article + '&prop=text&formatversion=2&origin=*')
       .then(resp => {
            if (!resp.ok) {
                throw `Server error: [${resp.status}] [${resp.statusText}] [${resp.url}]`;
            }
            return resp.json();
        })
        .then(receivedJson => {
            conting = true;
            var cleanText = receivedJson.parse.text.replace(/<img[^>]*>/g,"").replace(/\<small\>/g,'').replace(/\<\/small\>/g,'').replace(/–/g,'-').replace(/<audio.*<\/audio>/g,"");
            wikiHolder.style.display = "none";
            wikiHolder.innerHTML = cleanText;
            var redirecting = document.getElementsByClassName('redirectMsg');
            if (redirecting.length > 0) {
                var redirURL = $('.redirectText')[0].firstChild.firstChild.innerHTML.replace(/ /g,"_");
                conting = false;
                fetchData(!conting, redirURL)
            }
            if(conting){
                if(document.getElementById("See_also") != null){
                    var seeAlso = document.getElementById("See_also").parentNode;
                } else if(document.getElementById("Notes") != null){
                    var seeAlso = document.getElementById("Notes").parentNode;
                } else if(document.getElementById("References") != null){
                    var seeAlso = document.getElementById("References").parentNode;
                } 
                var e = document.getElementsByClassName('mw-parser-output');
                if(document.getElementById("References") != null){
                    alsoIndex = Array.prototype.indexOf.call(seeAlso.parentNode.children, seeAlso);
                    for(var i = alsoIndex; i < e[0].children.length; i++){
                        e[0].removeChild(e[0].children[i]);
                    }
                }

                var all_bad_elements = wikiHolder.querySelectorAll("[rel='mw-deduplicated-inline-style'], [title='Name at birth'], [aria-labelledby='micro-periodic-table-title'], .barbox, .wikitable, .clade, .Expand_section, .nowrap, .IPA, .thumb, .mw-empty-elt, .mw-editsection, .nounderlines, .nomobile, .searchaux, #toc, .sidebar, .sistersitebox, .noexcerpt, #External_links, #Further_reading, .hatnote, .haudio, .portalbox, .mw-references-wrap, .infobox, .unsolved, .navbox, .metadata, .refbegin, .reflist, .mw-stack, #Notes, #References, .reference, .quotebox, .collapsible, .uncollapsed, .mw-collapsible, .mw-made-collapsible, .mbox-small, .mbox, #coordinates, .succession-box, .noprint, .mwe-math-element, .cs1-ws-icon");
    
                for(var i=0; i<all_bad_elements.length; i++){
                    all_bad_elements[i].remove();
                }
                
                var b = document.getElementsByTagName('b');
                while(b.length) {
                    var parent = b[ 0 ].parentNode;
                    while( b[ 0 ].firstChild ) {
                        parent.insertBefore(  b[ 0 ].firstChild, b[ 0 ] );
                    }
                    parent.removeChild( b[ 0 ] );
                }
                var a = wikiHolder.getElementsByTagName('a');
                while(a.length) {
                    var parent = a[ 0 ].parentNode;
                    while( a[ 0 ].firstChild ) {
                        parent.insertBefore(  a[ 0 ].firstChild, a[ 0 ] );
                    }
                    parent.removeChild( a[ 0 ] );
                }
                var bq = document.getElementsByTagName('blockquote');
                for(var i=0; i<bq.length; i++){
                    bq[i].innerHTML = bq[i].innerHTML.replace(/<[^>]*>?/gm, '');
                }
                var s = document.getElementsByTagName('sup')
                while(s.length) {
                    s[0].remove();
                }
                var ex = document.getElementsByClassName('excerpt');
                while(ex.length) {
                    ex[0].remove();
                }
                $(e[0]).find('[title]').each(function(){
                    this.removeAttribute('title');
                })
                $(e[0]).find('.mw-headline').contents().unwrap();
                var titleHolder = document.createElement("h1");
                var titleTxt = article.replace(/_/g, ' ');
                titleHolder.innerHTML = titleTxt;
                e[0].prepend(titleHolder);
                ansStr = titleTxt.replace(/ *\([^)]*\) */g, "").normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
                ans = ansStr.match(/\b(\w+)\b/g);
                ans = ans.filter( function( el ) {
                    return commonWords.indexOf( el ) < 0;
                  } );
                e[0].innerHTML = e[0].innerHTML.replace(/\(; /g,'(').replace(/\(, /g,'(').replace(/\(, /g,'(').replace(/: ​;/g,';').replace(/ \(\) /g,' ').replace(/<\/?span[^>]*>/g,"");;
                $(e[0]).find('*').removeAttr('class').removeAttr('style');
                
                $(e[0]).find("p, blockquote, h1, h2, table, li, i, cite, span").contents().filter(function(i,el){
                    return el.nodeType ===3;
                }).each(function(i,el){
                    var $el = $(el);
                    var replaced = $el.text().replace(/([\.,:()\[\]?!;`\~\-\u2013\—&*"])/g, '<span class="punctuation">$1</span>');
                    el.replaceWith(replaced);
                });
                
                e[0].innerHTML = e[0].innerHTML.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/(<style.*<\/style>)/g, "").replace(/(<span class="punctuation">.<\/span>)|(^|<\/?[^>]+>|\s+)|([^\s<]+)/g, '$1$2<span class="innerTxt">$3</span>').replace('<<span class="innerTxt">h1>','<h1><span class="innerTxt">');
                $(e[0]).find('*:empty').remove();
                wikiHolder.innerHTML = wikiHolder.innerHTML.replace(/<!--(?!>)[\S\s]*?-->/g, '');
                $(".mw-parser-output span").not(".punctuation").each(function() {
                    var txt = this.innerHTML.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    if(!commonWords.includes(txt)){
                        this.classList.toggle('baffled');
                        let b = baffle(this).once().set({
                            characters: 'abcd'
                        });
                        baffled.push([txt, b]);
                    }
                });
    
                if(guessedWords.length > 0){
                    for(var i = 0; i < guessedWords.length; i++){
                        guessCounter += 1;
                        PerformGuess(guessedWords[i][0], true);
                    }
                }
                
                if(pluralizing){
                    document.getElementById("autoPlural").checked = true;
                } else{
                    document.getElementById("autoPlural").checked = false;
                }
    
                if(hidingZero){
                    document.getElementById("hideZero").checked = true;
                    HideZero();
                } else{
                    document.getElementById("hideZero").checked = false;
                    ShowZero();
                }
                
                wikiHolder.style.display = "flex";
            }
        })
        .catch(err => {
            console.error("Error in fetch", err);
            alert("Something went wrong while loading the page. Try refreshing.");
        });
}
LoadSave();

function ShowHints(){
    debugger;
    if (clicked){
        for(var i = 0; i < baffled.length; i++){
            var txt = baffled[i][1].elements[0].value;
            var txt1 = txt.replace(/(.)./g, "$1_");
            baffled[i][1].elements[0].element.title = txt1;
        }
    }else{
        for(var i = 0; i < baffled.length; i++){
            baffled[i][1].elements[0].element.title = "";
        }     
    }
}

function PerformGuess(guessedWord, populate){
    clickThruIndex = 0;
    RemoveHighlights(false);
    var normGuess = guessedWord.normalize('NFD').replace(/[\u0300-\u036f]/g,"").toLowerCase();
    if(commonWords.includes(normGuess)){

    }
    else{
        var alreadyGuessed = false;
        for(var i=0; i<guessedWords.length; i++){
            if(guessedWords[i][0] == normGuess){
                var alreadyGuessed = true;
            }
        }
        if(!alreadyGuessed || populate){
            var numHits = 0;
            for(var i = 0; i < baffled.length; i++){
                if(baffled[i][0] == normGuess){
                    baffled[i][1].reveal();
                    baffled[i][1].elements[0].element.classList.remove("baffled");
                    baffled[i][1].elements[0].element.setAttribute("data-word",normGuess);
                    numHits += 1;
                    if(!populate){
                        baffled[i][1].elements[0].element.classList.add("highlighted");
                        currentlyHighlighted = normGuess;
                    }
                }
            }
            save.saveData.guessedWords = guessedWords;
            if(!populate){
                guessCounter += 1;
                guessedWords.push([normGuess,numHits,guessCounter]);
                SaveProgress();
            }
            LogGuess([normGuess,numHits,guessCounter], populate);
        } else{
            $("tr[data-guess='"+normGuess+"']").addClass("table-secondary");
            $("tr[data-guess='"+normGuess+"']")[0].scrollIntoView();
            currentlyHighlighted = normGuess;
            $('.innerTxt').each(function(){
                if(this.innerHTML.normalize('NFD').replace(/[\u0300-\u036f]/g,"").toLowerCase() == normGuess){
                    this.classList.add('highlighted');
                }
            });
        }
        if(ans.includes(normGuess)){
            ans = ans.filter(function(e) { return e !== normGuess })
        }
        if(ans.length == 0){
            WinRound(populate);
        }
    }
    document.getElementById("userGuess").value='';
}

function LogGuess(guess, populate){
    if(hidingZero){
        HideZero();
    }
    var newRow = guessLogBody.insertRow(0);
    newRow.class = 'curGuess';
    newRow.setAttribute('data-guess',guess[0]);
    if(!populate){
        newRow.classList.add('table-secondary');
    }
    if(guess[1] > 0){
        hitCounter += 1;
    }
    if(!pageRevealed){
        currentAccuracy = ((hitCounter / guessedWords.length)*100).toFixed(2);
    }
    if(guess[1] > 0){
        $(newRow).on('click', function(e) {
            e.preventDefault();
            var inTxt = this.getElementsByTagName('td')[1].innerHTML.normalize('NFD').replace(/[\u0300-\u036f]/g,"").toLowerCase();
            allInstances = wikiHolder.querySelectorAll('[data-word="'+inTxt+'"]');
            if(currentlyHighlighted == null){
                clickThruIndex = 0;
                currentlyHighlighted = inTxt;
                this.classList.add('table-secondary');
                $('.innerTxt').each(function(){
                    if(this.innerHTML.normalize('NFD').replace(/[\u0300-\u036f]/g,"").toLowerCase() == currentlyHighlighted){
                        $(this).addClass('highlighted');
                    }
                });
            } else{
                if(inTxt == currentlyHighlighted){
                    
                } else{
                    clickThruIndex = 0;
                    RemoveHighlights(false);
                    this.classList.add('table-secondary');
                    $('.innerTxt').each(function(){
                        if(this.innerHTML.normalize('NFD').replace(/[\u0300-\u036f]/g,"").toLowerCase() == inTxt){
                            this.classList.add('highlighted');
                        }
                    })
                    currentlyHighlighted = inTxt;  
                }
            }
            $('.superHighlighted').each(function(){
                this.classList.remove('superHighlighted');
            });
            allInstances[clickThruIndex % allInstances.length].classList.add('superHighlighted');
            allInstances[clickThruIndex % allInstances.length].scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'end'
            });
            clickThruIndex += 1;
        });
    } else{
        $(newRow).on('click', function(e) {
            RemoveHighlights(true);
        });
    }
    newRow.innerHTML = '<td>'+guess[2]+'</td><td>'+guess[0]+'</td><td class="tableHits">'+guess[1]+'</td>';
    if(!populate){
        newRow.scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'end'
            });
    }
    
}

function WinRound(populate){
    document.getElementById("userGuess").disabled = true;
    if(!pageRevealed){
        RevealPage();
        if(!populate){
            gameScores[rIndex] = guessedWords.length;
            gameAccuracy[rIndex] = currentAccuracy;
            gameAnswers[rIndex] = ansStr;
            gameWins[rIndex] = 1;
            gameDates[rIndex] = new Date().toLocaleString();
        }
    }
    var streakCount = 0;
    for(var i = gameWins.length; i>-1; i--){
        if(gameWins[i] == 1){
            streakCount += 1;
        }
        if(gameWins[i] == 0){
            break;
        }
    }

    if(!populate){
        rIndex++;
    }

    document.getElementById("winText").innerHTML = `<h3>Congratulations, you solved r-dactle #${rIndex}!</h3><ul><li>The answer was: ${ansStr}</li><li>You solved it in ${gameScores[rIndex-1]} guesses</li><li>Your accuracy was ${currentAccuracy}%</li></ul><p><a href="javascript:ShareResults();">Share your results</a></p>`;
    document.getElementById("winText").style.display = 'block';

    SaveProgress();
}

function ShareResults(){
    if(localStorage.getItem("rSavet") != null){
        save = JSON.parse(localStorage.getItem("rSavet"));
        const shareText = "I solved this r-dactle in " + gameScores[rIndex-1] + " guesses with an accuracy of " + currentAccuracy + "%. Played at https://www.r-dactle.com/?article="+save.saveData.article;
        const copied = ClipboardJS.copy(shareText);
        if (copied) {
            alert("Results copied to clipboard. Thanks for playing!");
        }
        else {
            alert("Something went wrong trying to copy results to clipboard.");
        }
    }

}

function RevealPage(){
    RemoveHighlights(false);
    for(var i = 0; i < baffled.length; i++){
        baffled[i][1].reveal();
        baffled[i][1].elements[0].element.classList.remove("baffled");
    }
    pageRevealed = true;
}

function BuildStats(){
    for(var i = statLogBody.rows.length-1;i>0;i--){
        statLogBody.deleteRow(i);
    }
    for(var i = 0; i < gameWins.length; i++){
        if(gameWins[i] == 1){
            var statRow = statLogBody.insertRow(1);
            statRow.innerHTML='<td>'+(i+1)+'</td><td>'+gameAnswers[i]+'</td><td>'+gameScores[i]+'</td><td>'+gameAccuracy[i]+'%</td><td>'+gameDates[i]+'</td>';
        }
    }
}

function HideZero(){
    hidingZero = true;
    SaveProgress();
    $('.tableHits').each(function(){
        if(this.innerHTML == '0'){
            $(this).parent().addClass('hiddenRow');
        }
    });
}

function ShowZero(){
    hidingZero = false;
    SaveProgress();
    $('.hiddenRow').each(function(){
        $(this).removeClass('hiddenRow');
    });
}


function RemoveHighlights(clearCur){
    if(clearCur){
        currentlyHighlighted = null;
    }
    $('.highlighted').each(function(){
        $(this).removeClass('highlighted');
    });
    $('.superHighlighted').each(function(){
        this.classList.remove('superHighlighted');
    });
    $('#guessLogBody').find('.table-secondary').each(function(){
        this.classList.remove('table-secondary');
    })
}

function SaveProgress(){
    if($('#autoPlural').is(':checked')){
        pluralizing = true;
    } else{
        pluralizing = false;
    }
    save.saveData.rIndex = rIndex;
    save.saveData.guessedWords = guessedWords;
    save.saveData.gameWins = gameWins;
    save.saveData.gameScores = gameScores;
    save.saveData.gameAccuracy = gameAccuracy;
    save.saveData.gameDates = gameDates;
    save.prefs.hidingZero = hidingZero;
    save.prefs.hidingLog = hidingLog;
    save.prefs.pluralizing = pluralizing;
    localStorage.setItem("rSavet",JSON.stringify(save));
}