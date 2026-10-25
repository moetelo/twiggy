<?php
declare(strict_types=1);

namespace App;

class TypedGetters
{
    public function getId(): int|string
    {
        return 0;
    }

    public function getItems(): \Countable&\Traversable
    {
        return new \ArrayIterator();
    }

    public function getUntyped()
    {
        return null;
    }
}
