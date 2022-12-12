package client.position;

import common.models.postion.Position;

public class PositionContext {
    private Position.PositionType type;
    private Position.PositionView view;

    public PositionContext(Position.PositionView view, Position.PositionType type) {
        this.type = type;
        this.view = view;
    }

    public Position.PositionType getPositionType() {
        return type;
    }

    public Position.PositionView getPositionView() {
        return view;
    }
}
