export enum EventCommandCode {
    // -------------------------------------------------
    // Message
    // -------------------------------------------------

    /** Show Text */
    ShowText = 101,

    /** Show Choices */
    ShowChoices = 102,

    /** Input Number */
    InputNumber = 103,

    /** Select Item */
    SelectItem = 104,

    /** Show Scrolling Text */
    ShowScrollingText = 105,

    /** Additional line for Show Text */
    TextLine = 401,

    /** Choice option */
    Choice = 402,

    /** When Cancel */
    ChoiceCancel = 403,

    /** End Choices */
    EndChoices = 404,

    /** Additional line for Scrolling Text */
    ScrollingTextLine = 405,

    // -------------------------------------------------
    // Flow Control
    // -------------------------------------------------

    /** Conditional Branch */
    ConditionalBranch = 111,

    /** Loop */
    Loop = 112,

    /** Break Loop */
    BreakLoop = 113,

    /** Exit Event Processing */
    ExitEventProcessing = 115,

    /** Common Event */
    CallCommonEvent = 117,

    /** Label */
    Label = 118,

    /** Jump to Label */
    JumpToLabel = 119,

    /** Else */
    Else = 411,

    /** End */
    End = 412,

    /** Repeat Above */
    RepeatAbove = 413,

    // -------------------------------------------------
    // Party
    // -------------------------------------------------

    /** Control Switches */
    ControlSwitches = 121,

    /** Control Variables */
    ControlVariables = 122,

    /** Control Self Switch */
    ControlSelfSwitch = 123,

    /** Control Timer */
    ControlTimer = 124,

    /** Change Gold */
    ChangeGold = 125,

    /** Change Items */
    ChangeItems = 126,

    /** Change Weapons */
    ChangeWeapons = 127,

    /** Change Armors */
    ChangeArmors = 128,

    /** Change Party Member */
    ChangePartyMember = 129,

    // -------------------------------------------------
    // Actor
    // -------------------------------------------------

    /** Change HP */
    ChangeHP = 311,

    /** Change MP */
    ChangeMP = 312,

    /** Change TP */
    ChangeTP = 326,

    /** Change State */
    ChangeState = 313,

    /** Recover All */
    RecoverAll = 314,

    /** Change EXP */
    ChangeExp = 315,

    /** Change Level */
    ChangeLevel = 316,

    /** Change Parameter */
    ChangeParameter = 317,

    /** Change Skill */
    ChangeSkill = 318,

    /** Change Equipment */
    ChangeEquipment = 319,

    /** Change Name */
    ChangeName = 320,

    /** Change Class */
    ChangeClass = 321,

    /** Change Actor Images */
    ChangeActorImages = 322,

    /** Change Vehicle Image */
    ChangeVehicleImage = 323,

    /** Change Nickname */
    ChangeNickname = 324,

    /** Change Profile */
    ChangeProfile = 325,

    // -------------------------------------------------
    // Movement
    // -------------------------------------------------

    /** Transfer Player */
    TransferPlayer = 201,

    /** Set Vehicle Location */
    SetVehicleLocation = 202,

    /** Set Event Location */
    SetEventLocation = 203,

    /** Scroll Map */
    ScrollMap = 204,

    /** Set Movement Route */
    SetMovementRoute = 205,

    /** Movement Route Command */
    MovementRouteCommand = 505,

    /** Get on/off Vehicle */
    GetOnOffVehicle = 206,

    // -------------------------------------------------
    // Character
    // -------------------------------------------------

    /** Change Transparency */
    ChangeTransparency = 211,

    /** Show Animation */
    ShowAnimation = 212,

    /** Show Balloon Icon */
    ShowBalloonIcon = 213,

    /** Erase Event */
    EraseEvent = 214,

    /** Change Player Followers */
    ChangePlayerFollowers = 216,

    /** Gather Followers */
    GatherFollowers = 217,

    /** Fadeout Screen */
    FadeoutScreen = 221,

    /** Fadein Screen */
    FadeinScreen = 222,

    /** Tint Screen */
    TintScreen = 223,

    /** Flash Screen */
    FlashScreen = 224,

    /** Shake Screen */
    ShakeScreen = 225,

    /** Wait */
    Wait = 230,

    // -------------------------------------------------
    // Pictures
    // -------------------------------------------------

    /** Show Picture */
    ShowPicture = 231,

    /** Move Picture */
    MovePicture = 232,

    /** Rotate Picture */
    RotatePicture = 233,

    /** Tint Picture */
    TintPicture = 234,

    /** Erase Picture */
    ErasePicture = 235,

    // -------------------------------------------------
    // Weather
    // -------------------------------------------------

    /** Set Weather Effect */
    SetWeatherEffect = 236,

    // -------------------------------------------------
    // Audio & Video
    // -------------------------------------------------

    /** Play BGM */
    PlayBgm = 241,

    /** Fadeout BGM */
    FadeoutBgm = 242,

    /** Save BGM */
    SaveBgm = 243,

    /** Replay BGM */
    ReplayBgm = 244,

    /** Play BGS */
    PlayBgs = 245,

    /** Fadeout BGS */
    FadeoutBgs = 246,

    /** Play ME */
    PlayMe = 249,

    /** Play SE */
    PlaySe = 250,

    /** Stop SE */
    StopSe = 251,

    /** Play Movie */
    PlayMovie = 261,

    // -------------------------------------------------
    // Scene
    // -------------------------------------------------

    /** Open Menu Screen */
    OpenMenuScreen = 351,

    /** Open Save Screen */
    OpenSaveScreen = 352,

    /** Game Over */
    GameOver = 353,

    /** Return to Title Screen */
    ReturnToTitle = 354,

    // -------------------------------------------------
    // Script & Plugins
    // -------------------------------------------------

    /** Script */
    Script = 355,

    /** Plugin Command */
    PluginCommand = 356,

    /** Additional Script Line */
    ScriptLine = 655,

    // -------------------------------------------------
    // System
    // -------------------------------------------------

    /** Change Battle BGM */
    ChangeBattleBgm = 132,

    /** Change Victory ME */
    ChangeVictoryMe = 133,

    /** Change Save Access */
    ChangeSaveAccess = 134,

    /** Change Menu Access */
    ChangeMenuAccess = 135,

    /** Change Encounter */
    ChangeEncounter = 136,

    /** Change Formation Access */
    ChangeFormationAccess = 137,

    /** Change Window Color */
    ChangeWindowColor = 138,

    /** Change Defeat ME */
    ChangeDefeatMe = 139,

    /** Change Vehicle BGM */
    ChangeVehicleBgm = 140,

    // -------------------------------------------------
    // Battle
    // -------------------------------------------------

    /** Battle Processing */
    BattleProcessing = 301,

    /** Shop Processing */
    ShopProcessing = 302,

    /** Name Input Processing */
    NameInputProcessing = 303,

    /** If Win */
    IfWin = 601,

    /** If Escape */
    IfEscape = 602,

    /** If Lose */
    IfLose = 603,

    /** Change Enemy HP */
    ChangeEnemyHp = 331,

    /** Change Enemy MP */
    ChangeEnemyMp = 332,

    /** Change Enemy State */
    ChangeEnemyState = 333,

    /** Enemy Recover All */
    EnemyRecoverAll = 334,

    /** Enemy Appear */
    EnemyAppear = 335,

    /** Enemy Transform */
    EnemyTransform = 336,

    /** Show Battle Animation */
    ShowBattleAnimation = 337,

    /** Force Action */
    ForceAction = 339,

    /** Abort Battle */
    AbortBattle = 340,
}