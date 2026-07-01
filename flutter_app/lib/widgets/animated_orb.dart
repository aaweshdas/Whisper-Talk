import 'dart:math';
import 'package:flutter/material.dart';

/// Animated glowing orb for the background
class AnimatedOrb extends StatefulWidget {
  final Color color;
  final double size;
  final double? top;
  final double? bottom;
  final double? left;
  final double? right;

  const AnimatedOrb({
    super.key,
    required this.color,
    required this.size,
    this.top,
    this.bottom,
    this.left,
    this.right,
  });

  @override
  State<AnimatedOrb> createState() => _AnimatedOrbState();
}

class _AnimatedOrbState extends State<AnimatedOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: Duration(seconds: 3 + Random().nextInt(2)),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: widget.top,
      bottom: widget.bottom,
      left: widget.left,
      right: widget.right,
      child: IgnorePointer(
        child: AnimatedBuilder(
          animation: _anim,
          builder: (_, __) => Transform.scale(
            scale: _anim.value,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
