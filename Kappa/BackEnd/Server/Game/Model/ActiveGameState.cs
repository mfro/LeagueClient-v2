﻿using MFroehlich.Parsing.JSON;

namespace Kappa.BackEnd.Server.Game.Model {
    [JSONSerializable]
    public class ActiveGameState {
        public bool InGame { get; set; }
        public bool Launched { get; set; }
    }
}
