'use strict';

// Phonics word pools modelled on the categories used by phonicswordlist.com.
// Each sub-type has real words and nonsense ("silly") words. Nonsense words follow the sound pattern but are not
// English words; test/generators.test.js checks them against the real pools and a block-list.
// A teacher should still skim a sheet before using it. Grade bands are guidance, not a standards crosswalk.
const w = (s) => s.trim().split(/\s+/);

const CATEGORIES = [
  {
    id: 'cvc', name: 'CVC Words (consonant-vowel-consonant)', grades: '1',
    note: 'Short vowel sounds in three-letter words.',
    subtypes: [
      { id: 'short-a', name: 'Short a', real: w('cat bat hat mat rat sat pat fan can man pan ran tan van bag tag wag nap cap map tap lap gap sad bad dad had mad pad jam ham dam ram yam wax tax'), nonsense: w('zat vap kag lan pab rab sab wab yan zab mab bax jat vam dax') },
      { id: 'short-e', name: 'Short e', real: w('bed red pen hen ten men web leg peg beg get jet net pet set wet vet yet den fed led wed gem hem yes bet let met'), nonsense: w('zep vem keb nep sef wep jeb lem pex yeb zeg bef mep sep') },
      { id: 'short-i', name: 'Short i', real: w('pig big dig fig wig bin fin pin tin win sit hit bit fit kit lit pit zip dip hip lip rip sip tip lid kid did rid mix six fix'), nonsense: w('zim vib nid pib jit lif sib wim yin zil bix fip vit gim') },
      { id: 'short-o', name: 'Short o', real: w('dog log fog hog jog top hop mop pop pot cot dot hot lot not rot box fox job mob rob sob cob nod pod rod sod cod'), nonsense: w('zop vod kob nop lom pob rog wox yop zot jop vob fon gox') },
      { id: 'short-u', name: 'Short u', real: w('bug hug jug mug rug tug bus cup pup sun run bun fun gun nut cut hut gut but bud mud cub hub tub sub rub sum gum hum'), nonsense: w('zub vud kug nup lum pud rup sug wub yun zun jub vum fub') },
    ],
  },
  {
    id: 'blends', name: 'Blends', grades: '1',
    note: 'Two consonant sounds blended together, each sound still heard.',
    subtypes: [
      { id: 'l-blends', name: 'L-blends (bl, cl, fl, gl, pl, sl)', real: w('black blend block blink blot bled clap clip clock clam cliff flag flat flip flock flop glad glass glob plan plug plum plus slam slap sled slip slot slug'), nonsense: w('blat blep blim blon clab clem clon flab flem flib glim glop plam plen plin sliv slon slub') },
      { id: 'r-blends', name: 'R-blends (br, cr, dr, fr, gr, pr, tr)', real: w('brag brick brim brush crab crib crop cross drag dress drip drop drum frog fresh grab grass grin grip press print trap trick trim trip truck trot'), nonsense: w('brep brin bron crem crin crub drap drem drin drom frab frem frin grem grop prab prem prin trab trem trin trom') },
      { id: 's-blends', name: 'S-blends (sc, sk, sm, sn, sp, st, sw)', real: w('scab scan skid skip skin skit smug smell snap snip snack spot spin spill spend step stop stem stick swim swam swan swell stub span snug stag'), nonsense: w('scom skeb skun smeb smip snab snem spab spem spim stov swem swob skup') },
      { id: 'final-blends', name: 'Final blends (nd, nt, mp, nk, st, ft, lt, lp, lk)', real: w('hand sand bend send tent went camp lamp jump bump pump pink sink wink tank bank nest rest test vest left lift gift soft raft belt melt help milk silk'), nonsense: w('zand pand gend vend jent nent vemp lomp zump nink vink zank pesk dilp relt zift') },
    ],
  },
  {
    id: 'digraphs', name: 'Digraphs', grades: '1',
    note: 'Two letters that make one new sound.',
    subtypes: [
      { id: 'sh', name: 'sh', real: w('ship shop shut shed shin shell shock shelf fish dish wish wash bush cash rush mash push lash flash splash crash brush shrimp'), nonsense: w('shab shep shim shom shup zash fesh wush nish jush bish vush pesh') },
      { id: 'ch', name: 'ch', real: w('chin chip chop chat chug chap check chest chess chick chill champ much such rich bunch lunch punch bench ranch pinch inch'), nonsense: w('chab chep chim chog chum chev chup nech lonch vunch zinch ponch') },
      { id: 'th', name: 'th', real: w('thin thick thud thus that this them then with bath math path moth cloth tenth sixth month thank think thorn thump'), nonsense: w('thab thep thim thom thup vith zath poth mith thon thib reth foth dath') },
      { id: 'wh', name: 'wh', real: w('when what whip whim whiz which whisk whack whelp whiff whet whelk wheel wheat whale while white whirl whisper whistle'), nonsense: w('whab whep whon whup whem whib whov whel whiv whud') },
      { id: 'ck', name: 'ck', real: w('back deck kick lock duck sock pack neck rock tick luck sick pick quick stuck truck clock brick stick trick snack track'), nonsense: w('zack veck jick vock dack nuck teck fick plick snock') },
      { id: 'ng-nk', name: 'ng and nk', real: w('ring sing king song long lung wing hang bang rang sang gang strong thing bring spring sting swing sink pink wink bank tank junk trunk skunk'), nonsense: w('zing vong pung lang meng jang nink vunk zank plink slong brang') },
    ],
  },
  {
    id: 'vce', name: 'VCE (Silent e)', grades: '1',
    note: 'Vowel-consonant-e: the silent e makes the vowel say its name.',
    subtypes: [
      { id: 'a-e', name: 'a_e', real: w('cake lake make take bake game name same came tape cape gate late plate shape snake grape frame wave save cave gave safe made page stage trade'), nonsense: w('zake vame lape nate hape wabe kade zate rame jabe mave fale') },
      { id: 'i-e', name: 'i_e', real: w('bike like hike kite bite time dime lime mine nine fine line pine vine five hive dive drive slide ride hide side smile white'), nonsense: w('zike vime lipe nite tife wibe kide zite fime gine') },
      { id: 'o-e', name: 'o_e', real: w('bone cone tone home nose rose hose note vote joke poke woke smoke stone drove stove hole pole mole rope hope code mode rode globe'), nonsense: w('zobe vome lote yone hobe yope doke zole rone jode') },
      { id: 'u-e', name: 'u_e', real: w('cube cute tube tune huge mule rule dune flute prune fuse mute plume fume rude cure pure June excuse perfume use'), nonsense: w('zube vute lume gube tuke jule rute fune wuke nuze') },
    ],
  },
  {
    id: 'r-controlled', name: 'R-Controlled Vowels (bossy r)', grades: '1-2',
    note: 'The r changes the vowel sound.',
    subtypes: [
      { id: 'ar', name: 'ar', real: w('car far bar jar star card yard farm barn park dark shark start smart sharp arm art cart harp mark'), nonsense: w('zar vark narp lar pard garp mard jarn sarp tarf') },
      { id: 'or', name: 'or', real: w('for corn horn born fork cork pork port sort short sport storm torn worn thorn north fort form cord lord'), nonsense: w('zor vorn nort pord lorp gorb dorn jort sorf korb') },
      { id: 'er', name: 'er', real: w('her fern herd perk jerk clerk verb term sister after under over river tiger water paper letter flower winter summer dinner'), nonsense: w('zer verf nerp lerm pern gerb merk ferl derb yerk') },
      { id: 'ir', name: 'ir', real: w('sir stir bird girl dirt first shirt skirt third birth fir whirl swirl twirl chirp thirst squirt flirt birthday thirty'), nonsense: w('zir virt nirp lirm pirb girf tirk yirm kirb wirp') },
      { id: 'ur', name: 'ur', real: w('fur burn turn hurt curl purse nurse surf burst church curb blur slur spur lurk urn churn purr hurl turkey'), nonsense: w('zur vurt nurp lurm purb gurf durm jurk wurp yurb') },
    ],
  },
  {
    id: 'advanced-consonants', name: 'Advanced Consonants', grades: '2-3',
    note: 'Silent letters, soft c and g, and consonant spelling patterns.',
    subtypes: [
      { id: 'silent', name: 'Silent letters (kn, wr, gn, mb)', real: w('knot knit knob knack knelt knock wrap wren wrist wreck wrong gnat gnaw gnash lamb comb thumb climb crumb limb numb dumb bomb'), nonsense: w('knab knep knim knop knub wrab wrep wrim wrop wrub gnab gnep gnim gnop') },
      { id: 'soft-c-g', name: 'Soft c and soft g', real: w('cent city circle face race rice mice nice price dance fence cell cycle pencil space gem gym giant ginger gentle giraffe magic germ cage stage'), nonsense: w('cep cim cyb ceb cipe cize gep gim gyb gepe gine gize') },
      { id: 'dge-tch', name: 'dge and tch', real: w('badge edge bridge fudge hedge judge ledge lodge ridge smudge trudge dodge catch match patch watch witch ditch pitch hutch stitch fetch sketch batch hatch latch notch scratch'), nonsense: w('bidge dadge fedge godge hudge lidge nodge vadge zedge zatch jetch vitch dotch lutch kitch') },
      { id: 'ph-qu', name: 'ph and qu', real: w('phone phase photo phrase graph dolphin elephant quit quiz quick quack queen quiet quilt quest squid squash question quote phonics trophy'), nonsense: w('phab phep phim phob phug quab quep quim quob quug') },
    ],
  },
  {
    id: 'affixes', name: 'Prefixes and Suffixes', grades: '2-3',
    note: 'Word parts added to the front or end of a base word.',
    subtypes: [
      { id: 'prefixes', name: 'Prefixes (un-, re-, dis-, mis-, pre-)', real: w('unhappy unlock unfair unkind undo untie unsafe redo replay reread rewrite rebuild return reuse disagree dislike disappear distrust dishonest misspell mistake misplace mislead misread preview prepay preheat preschool pretest premix'), nonsense: w('unvam refob disnip misrab prevod unwab resep disjit mislun prezib unkep rezop') },
      { id: 'suffixes', name: 'Suffixes (-ing, -ed, -er, -est, -ly, -ful, -less, -ness)', real: w('jumping helping running playing jumped helped walked looked taller faster smaller older fastest smallest slowly quickly kindly softly careful helpful joyful thankful careless helpless homeless sadness kindness'), nonsense: w('zabbing vepping mipped lunked zabber vomer zipest fanest dobly zekly nopful vibful zatless pibless lomness') },
    ],
  },
  {
    id: 'multisyllable', name: 'Multi-syllable Words', grades: '2-5',
    note: 'Break longer words into syllables to read them.',
    subtypes: [
      { id: 'two-syllable', name: 'Two syllables', real: w('rabbit basket napkin sunset kitten magnet picnic muffin cactus insect happen button problem hamster window winter doctor puppet public planet lemon'), nonsense: w('zabnit vemkip lopbat nipsun kemlat bovpid tafnum wibkep jonmab pikzet') },
      { id: 'compound', name: 'Compound words', real: w('sunshine cupcake pancake backpack football popcorn rainbow starfish sailboat butterfly bedroom birthday cannot classroom cowboy doghouse fireman homework inside lunchbox mailbox notebook playground raincoat sandbox seashell snowman'), nonsense: w('blipdog zabcup vemsun lunpot kepmat bobdip tavrain jipbox wolcat nopsun') },
      { id: 'three-syllable', name: 'Three or more syllables', real: w('alligator banana computer dinosaur fantastic hospital important kangaroo library medicine family potato tomato umbrella vacation volcano yesterday beautiful caterpillar elephant adventure animal wonderful remember'), nonsense: w('mebatop zikadum lopenat vaniket bofidum tezamin nupolid ragivet domelup sipakod') },
    ],
  },
];

module.exports = { CATEGORIES };
